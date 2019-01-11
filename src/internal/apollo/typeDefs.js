import gql from 'graphql-tag';

const typeDefs = gql`
  scalar DateTime

  enum CompilerStatus {
    COMPILING
    PENDING
    ERROR
    DONE
  }

  enum LogEncoding {
    BASE64
    UTF8
  }

  enum AppUpdateStatus {
    ERROR
    IGNORED
    APPLIED
    PENDING
  }

  enum ProcessStatus {
    CRASHED
    RUNNING
    RESTARTING
    TERMINATED
  }

  enum LogLevel {
    ERROR
    WARNING
    INFO
  }

  type LogEntry {
    encoding: LogEncoding
    data: String
  }

  type EnvVar {
    key: String
    value: String
  }

  type Process {
    id: ID
    pid: Int
    title: String
    path: String
    logs(encoding: LogEncoding): [LogEntry]
    args: [String]
    status: ProcessStatus
    cpu: Float
    memory: Int
    env: [EnvVar]
  }

  type Compiler {
    id: ID
    status: CompilerStatus
    state: String
    hash: String
    process: Process
  }

  type Proxy {
    id: ID
    path: String
    url: String
    enabled: Boolean
    tags: [String]
    createdAt: DateTime
  }

  type Request {
    id: ID
    statusCode: Int
    method: String
    url: String
    time: Float
  }

  input EnvVarInput {
    key: String
    value: String
  }

  type Query {
    processes: [Process]
    compilers: [Compiler]
    proxies: [Proxy]
    requests: [Request]
    compiler(compilerId: ID): Compiler
    process(processId: ID!): Process
  }

  type Mutation {
    log(message: String): Boolean

    requestProcessed(
      id: ID
      statusCode: Int
      method: String
      url: String
      time: Float
    ): Boolean

    registerApp(appId: ID, compilerId: ID, processId: ID): Boolean
    unregisterApp(appId: ID!): Boolean
    notifyAppUpdateStatus(appId: ID!, status: AppUpdateStatus!): Boolean
    notifyAppUpdateModulesUnaccepted(appId: ID!, modules: [String]): Boolean
    notifyAppUpdateError(appId: ID!, error: String): Boolean

    registerProcess(
      processId: ID
      path: String
      title: String
      args: [String]
      env: [EnvVarInput]
    ): Process
    processStarted(processId: ID!, pid: Int): Boolean
    processExited(processId: ID!, code: Int, error: String): Boolean
    processLog(
      processId: ID!
      encoding: LogEncoding
      data: String!
      level: LogLevel
    ): Boolean
    processUsage(processId: ID!, cpu: Float, memory: Int): Boolean

    registerCompiler(processId: ID): Compiler
    setCompilerStatus(compilerId: ID, status: CompilerStatus): Boolean
    publishCompilerState(compilerId: ID, hash: String, state: String): Boolean
    unregisterCompiler(compilerId: ID): Boolean

    registerProxy(
      path: String
      url: String
      tags: [String]
      appId: ID
      compilerId: ID
      processId: ID
    ): Proxy
    updateProxy(id: ID!, url: String): Boolean
    unregisterProxy(id: ID!): Boolean
  }

  type Subscription {
    compilerUpdated(compilerId: ID): Compiler
    requestProcessed: Request
    proxyRegistered: Proxy
    processRegistered: Process
    processUnregistered: Process
  }
`;

export default typeDefs;
