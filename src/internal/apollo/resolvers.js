import cuid from 'cuid';
import {PubSub, withFilter} from 'graphql-subscriptions';

const pubsub = new PubSub();

const encodings = {
  BASE64: 'base64',
  UTF8: 'utf8',
};

const resolvers = {
  Proxy: {
    enabled: (proxy, _params, _context) => {
      return !!proxy.url;
    },
  },
  Process: {
    logs: (proc, params, _context) => {
      return proc.logs.map(({buffer}) => {
        return {data: buffer.toString(encodings[params.encoding || 'UTF8'])};
      });
    },
  },
  Query: {
    // xx
    requests: (_, _params, context) => {
      return context.requests;
    },
    processes: (_, _params, context) => {
      return context.processes;
    },
    proxies: (_, _params, context) => {
      return context.proxies;
    },
    compilers: (_, _params, context) => {
      return context.compilers;
    },
    process: (_, params, context) => {
      return context.processes.find(({id}) => id === params.processId);
    },
    compiler: (_, params, context) => {
      return context.compilers.find(({id}) => id === params.compilerId);
    },
  },
  Mutation: {
    registerApp(_, params, context) {
      context.registerApp(params);
      return true;
    },
    unregisterApp(_, params, context) {
      context.unregisterApp(params);
      // FIXME: Remove all proxies matching app
      return true;
    },
    notifyAppUpdateStatus(_, params, context) {
      // TODO: Implement me!
      context;
      return true;
    },
    notifyAppUpdateModulesUnaccepted(_, params, context) {
      // TODO: Implement me!
      context;
      return true;
    },
    notifyAppUpdateError(_, params, context) {
      // TODO: Implement me!
      context;
      return true;
    },
    requestProcessed(_, params, context) {
      const req = context.processRequest(params);
      pubsub.publish('requestProcessed', {requestProcessed: req});
      return true;
    },
    registerProcess(_, {path, title, args, env}, context) {
      const proc = {
        path,
        title,
        args,
        env,
        logs: [],
        id: cuid(),
      };
      pubsub.publish('processRegistered', {processRegistered: proc});
      context.processes.push(proc);
      return proc;
    },
    processUsage(_, {processId, cpu, memory}, context) {
      const proc = context.processes.find(({id}) => id === processId);
      if (!proc) {
        return false;
      }
      proc.cpu = cpu;
      proc.memory = memory;
      pubsub.publish('processRegistered', {processRegistered: proc});
      return true;
    },
    processStarted(_, {processId, pid}, context) {
      const proc = context.processes.find(({id}) => id === processId);
      if (!proc) {
        return false;
      }
      proc.pid = pid;
      proc.status = 'RUNNING';
      pubsub.publish('processRegistered', {processRegistered: proc});
      return true;
    },
    processExited(_, {processId, code, error}, context) {
      const proc = context.processes.find(({id}) => id === processId);
      if (!proc) {
        return false;
      }
      if (code !== 0 || error) {
        proc.status = 'ERROR';
      } else {
        proc.status = 'TERMINATED';
      }
      pubsub.publish('processRegistered', {processRegistered: proc});
      return true;
    },
    processLog(_, {processId, encoding, data}, context) {
      pubsub.publish('processLog', {processLog: {processId, encoding, data}});
      const buffer = Buffer.from(data, encodings[encoding]);
      const proc = context.processes.find(({id}) => id === processId);
      if (!proc) {
        return false;
      }
      proc.logs.push({buffer});
      return true;
    },
    registerProxy(_, {url, path, tags, appId, compilerId}, context) {
      const proxy = {
        id: cuid(),
        url,
        path,
        tags,
        appId,
        compilerId,
        createdAt: Date.now(),
      };
      context.proxies.push(proxy);
      pubsub.publish('proxyRegistered', {proxyRegistered: proxy});
      return proxy;
    },
    updateProxy(_, {id, url}, context) {
      const proxy = context.proxies.find(({id: target}) => id === target);
      if (!proxy) {
        return false;
      }
      proxy.url = url;
      pubsub.publish('proxyRegistered', {proxyRegistered: proxy});
      return true;
    },
    unregisterProxy(_, {id}, context) {
      const index = context.proxies.findIndex(({id: target}) => id === target);
      if (index >= 0) {
        const proxy = context.proxies[index];
        context.proxies.splice(index, 1);
        pubsub.publish('proxyUnregistered', {proxyUnregistered: proxy});
        return true;
      }
      return false;
    },
    setCompilerStatus(_, {compilerId, status}, context) {
      const compiler = context.getCompiler(compilerId);
      compiler.status = status;
      pubsub.publish('compilerUpdated', {compilerUpdated: compiler});
      return compiler;
    },
    publishCompilerState(_, {compilerId, hash, state}, context) {
      const compiler = context.getCompiler(compilerId);
      compiler.state = state;
      compiler.hash = hash;
      pubsub.publish('compilerUpdated', {compilerUpdated: compiler});
      return compiler;
    },
  },
  Subscription: {
    // zz
    processRegistered: {
      subscribe: () => {
        return pubsub.asyncIterator('processRegistered');
      },
    },
    processUnregistered: {
      subscribe: () => {
        return pubsub.asyncIterator('processUnregistered');
      },
    },

    requestProcessed: {
      subscribe: () => {
        return pubsub.asyncIterator('requestProcessed');
      },
    },

    compilerUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('compilerUpdated'),
        (payload, variables) => {
          if (variables.compilerId) {
            return payload.compilerUpdated.id === variables.compilerId;
          }
          return true;
        },
      ),
    },

    proxyRegistered: {
      subscribe: () => {
        return pubsub.asyncIterator('proxyRegistered');
      },
    },
  },
};

export default resolvers;
