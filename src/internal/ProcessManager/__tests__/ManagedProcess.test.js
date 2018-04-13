import ManagedProcess from '/internal/ProcessManager/ManagedProcess';
import createClient from '#test/util/createClient';
import bl from 'bl';
import EventEmitter from 'events';

// mocks
import child_process from 'child_process';

jest.mock('child_process');
jest.mock('/internal/ProcessManager/kill');
jest.mock('/internal/ProcessManager/killOnExit');

describe('/ProcessManager/ManagedProcess', () => {
  let pkill;
  let ponce;

  const createFakeChild = () => {
    const child = new EventEmitter();
    child.stderr = bl('stderr');
    child.stdout = bl('stdout');
    return child;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    pkill = jest.spyOn(process, 'kill');
    ponce = jest.spyOn(process, 'once');
  });
  afterEach(() => {
    pkill.mockRestore();
    ponce.mockRestore();
  });
  it('should do things', () => {
    const client = createClient();
    const child = createFakeChild();
    child_process.spawn.mockImplementation(() => child);
    const proc = new ManagedProcess(client, {});
    expect(proc);
  });

  it('should do more things', () => {
    const client = createClient();
    const child = createFakeChild();
    child_process.spawn.mockImplementation(() => child);
    const proc = new ManagedProcess(client, {});
    const error = new Error();
    child.emit('error', error);
    expect(proc); // TODO: Finish me
  });

  it('should do things when child exits gracefully', () => {
    const client = createClient();
    const child = createFakeChild();
    child_process.spawn.mockImplementation(() => child);
    const proc = new ManagedProcess(client, {});
    child.emit('exit', 0);
    expect(proc); // TODO: Finish me
  });

  it('should do things when child exits with HMR restart code', () => {
    const client = createClient();
    const child = createFakeChild();
    child_process.spawn.mockImplementation(() => child);
    const proc = new ManagedProcess(client, {});
    child.emit('exit', 218);
    expect(proc); // TODO: Finish me
  });

  it('should kill KILL KIIILLLL', () => {
    const client = createClient();
    const child = createFakeChild();
    child_process.spawn.mockImplementation(() => child);
    const proc = new ManagedProcess(client, {});
    proc._kill();
    child.emit('exit', 218);
    proc._trySpawn();
    jest.runOnlyPendingTimers();
    expect(proc); // TODO: Finish me
  });

  it('handle streamers', () => {
    const client = createClient();
    const child = createFakeChild();
    child_process.spawn.mockImplementation(() => child);
    const proc = new ManagedProcess(client, {});
    const streamer = bl('test');
    const spy = jest.fn();
    proc._handleStream(streamer, spy);
    return new Promise((resolve, reject) => {
      streamer.on('end', resolve).on('error', reject);
    }).then(() => {
      expect(spy); // TODO: Finish me
    });
  });

  it('should do things when child exits with error', () => {
    const client = createClient();
    const child = createFakeChild();
    child_process.spawn.mockImplementation(() => child);
    const proc = new ManagedProcess(client, {});
    child.emit('exit', 1);
    expect(proc); // TODO: Finish me
  });

  it('should bail on errors', () => {
    const client = createClient();
    child_process.spawn.mockImplementation(() => {
      throw new Error();
    });
    expect(() => {
      const _proc = new ManagedProcess(client, {});
    }).toThrow(Error);
  });
});
