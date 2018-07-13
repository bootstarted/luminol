// @flow
import gql from 'graphql-tag';
import type {Client} from '/types';
import createDebug from '/internal/createDebug';
import ManagedProcess from './ManagedProcess';

const debug = createDebug('manager');

const PROCESS_QUERY = gql`
  query Processes {
    processes {
      id
      path
      args
      env {
        key
        value
      }
    }
  }
`;

const PROCESS_CREATED_SUBSCRIPTION = gql`
  subscription ConfigSubscription {
    processRegistered {
      id
      path
      args
      env {
        key
        value
      }
    }
  }
`;

const PROCESS_REMOVED_SUBSCRIPTION = gql`
  subscription ConfigSubscription {
    processUnregistered {
      id
    }
  }
`;

type Process = {
  id: string,
  pid: number,
  path: string,
  args: Array<string>,
  env: Array<{key: string, value: string}>,
};

class ProcessManager {
  instances: {[string]: ManagedProcess} = {};
  client: Client;

  constructor(client: Client) {
    this.client = client;
    const query = client.watchQuery({
      query: PROCESS_QUERY,
    });
    query.subscribe({
      next: ({data}) => {
        this.update(data.processes);
      },
    });
    query.subscribeToMore({
      document: PROCESS_CREATED_SUBSCRIPTION,
      updateQuery: (prev, {subscriptionData}) => {
        if (!subscriptionData.data) {
          return prev;
        }
        return {
          ...prev,
          processes: [
            ...prev.processes,
            subscriptionData.data.processRegistered,
          ],
        };
      },
    });
    query.subscribeToMore({
      document: PROCESS_REMOVED_SUBSCRIPTION,
      updateQuery: (prev, {subscriptionData}) => {
        if (!subscriptionData.data) {
          return prev;
        }
        const id = subscriptionData.data.processUnregistered.id;
        return {
          ...prev,
          processes: prev.processes.filter((config) => {
            return config.id !== id;
          }),
        };
      },
    });
  }

  _load(proc: Process) {
    if (this.instances[proc.id]) {
      return;
    }
    debug(`Loading process ${proc.id} => ${proc.path}`);
    this.instances[proc.id] = new ManagedProcess(this.client, proc);
  }

  _unload(id: string) {
    if (!this.instances[id]) {
      return;
    }
    const proc: ManagedProcess = this.instances[id];
    debug(`Unloading process ${proc.config.id} => ${proc.config.path}`);
    proc._close();
    delete this.instances[id];
  }

  update(processes: Array<Process>) {
    const toLoad = processes.filter(({id}) => !this.instances[id]);
    const toUnload = Object.keys(this.instances).filter((id) => {
      return !processes.some(({id: target}) => target === id);
    });
    toUnload.forEach((id) => this._unload(id));
    toLoad.forEach((config) => this._load(config));
  }
}

export default ProcessManager;
