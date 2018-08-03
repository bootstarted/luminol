// @flow
import {spawn} from 'child_process';
import Backoff from 'backo2';
import gql from 'graphql-tag';
import createDebug from '/internal/createDebug';
import pidusage from 'pidusage';
import killOnExit from './killOnExit';
import kill from './kill';

import type {Client} from '/types';
import type {Readable} from 'stream';

type Config = {
  id: string,
  path: string,
  args: Array<string>,
  env: Array<{key: string, value: string}>,
};

const PROCESS_STARTED_MUTATION = gql`
  mutation processStarted($processId: ID!, $pid: Int!) {
    processStarted(processId: $processId, pid: $pid)
  }
`;

const PROCESS_EXITED_MUTATION = gql`
  mutation processExited($processId: ID!, $code: Int, $error: String) {
    processExited(processId: $processId, code: $code, error: $error)
  }
`;

const LOG_MUTATION = gql`
  mutation processLog($processId: ID!, $encoding: LogEncoding, $data: String!) {
    processLog(processId: $processId, encoding: $encoding, data: $data)
  }
`;

const USAGE_MUTATION = gql`
  mutation processUsage($processId: ID!, $cpu: Float, $memory: Int) {
    processUsage(processId: $processId, cpu: $cpu, memory: $memory)
  }
`;

class ManagedProcess {
  rip: boolean = false;
  child = null;
  debug: (...Array<mixed>) => void;
  spawnTimeout = null;
  usageTimeout = null;
  backoff = new Backoff({min: 1000, max: 1000 * 5});
  config: Config;
  client: Client;
  lastCode: ?number;
  detonateOnError = process.env.NODE_ENV === 'test';

  _close = () => {
    this.rip = true;
    this._kill();
  };

  constructor(client: Client, config: Config) {
    this.client = client;
    this.config = config;
    this.debug = createDebug(`process:${this.config.id}`);
    process.once('beforeExit', this._close);
    process.once('exit', this._close);
    this._trySpawn();
    // FIXME: Re-enable this eventually
    // this._pollUsage();
  }

  _pollUsage() {
    if (!this.rip) {
      this.usageTimeout = setTimeout(() => this._pollUsage(), 2000);
    }
    if (this.child) {
      pidusage(this.child.pid, (err, stats) => {
        if (err) {
          this.debug('Unable to get usage stats');
          return;
        }
        this.client.mutate({
          mutation: USAGE_MUTATION,
          variables: {
            processId: this.config.id,
            cpu: stats.cpu,
            memory: stats.memory,
          },
        });
      });
    }
  }

  _kill() {
    if (this.spawnTimeout) {
      clearTimeout(this.spawnTimeout);
    }
    if (this.child) {
      kill(this.child);
    }
  }

  _trySpawn() {
    if (this.child || this.spawnTimeout || this.rip) {
      return;
    }
    if (!this.lastCode) {
      this._spawn();
      return;
    }
    this.spawnTimeout = setTimeout(() => {
      this.spawnTimeout = null;
      this._spawn();
    }, this.backoff.duration());
  }

  _handleStream(stream: Readable, fn: (Buffer) => void) {
    stream.on('readable', () => {
      let data;
      while ((data = stream.read())) {
        // invariant(Buffer.isBuffer(data));
        // See: https://github.com/facebook/flow/issues/3203
        // $ExpectError
        fn(data);
      }
    });
  }

  _spawn() {
    const debug = this.debug;
    const processId = this.config.id;
    const env = {
      ...process.env,
    };
    (this.config.env || []).forEach(({key, value}) => {
      env[key] = value;
    });
    try {
      const exe = this.config.path;
      const args = this.config.args;
      debug(`Spawning "${exe} ${(args || []).join(' ')}"`);
      const child = (this.child = spawn(exe, args, {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      }));
      this.client.mutate({
        mutation: PROCESS_STARTED_MUTATION,
        variables: {processId, pid: child.pid},
      });

      this._handleStream(child.stdout, (data) => {
        debug('stdout: ', data.toString('utf8'));
        this.client.mutate({
          mutation: LOG_MUTATION,
          variables: {
            processId,
            encoding: 'BASE64',
            data: data.toString('base64'),
          },
        });
      });
      this._handleStream(child.stderr, (data) => {
        debug('stderr: ', data.toString('utf8'));
        this.client.mutate({
          mutation: LOG_MUTATION,
          variables: {
            processId,
            encoding: 'BASE64',
            data: data.toString('base64'),
          },
        });
      });

      child.once('exit', (code) => {
        this.backoff.reset();
        this.child = null;
        this.lastCode = code;
        if (code === 218) {
          this.client.mutate({
            mutation: PROCESS_EXITED_MUTATION,
            variables: {processId, code},
          });
          this._trySpawn();
        } else {
          this.client.mutate({
            mutation: PROCESS_EXITED_MUTATION,
            variables: {processId, code},
          });
        }
      });
      child.once('error', (error) => {
        this.child = null;
        debug(`Process crashed: ${error}`);
        this.client.mutate({
          mutation: PROCESS_EXITED_MUTATION,
          variables: {processId, code: -1, error},
        });
      });

      killOnExit(child);
    } catch (error) {
      debug(`Process crashed: ${error}`);
      this.client.mutate({
        mutation: PROCESS_EXITED_MUTATION,
        variables: {processId, code: -1, error},
      });
      if (this.detonateOnError) {
        throw error;
      }
    }
  }
}

export default ManagedProcess;
