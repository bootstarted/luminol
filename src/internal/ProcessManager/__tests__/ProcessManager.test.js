import ProcessManager from '/internal/ProcessManager/ProcessManager';
import createClient from '#test/util/createClient';

// mocks
import ManagedProcess from '/internal/ProcessManager/ManagedProcess';

jest.mock('/internal/ProcessManager/ManagedProcess');

describe('/internal/ProcessManager/ProcessManager', () => {
  beforeEach(() => {
    ManagedProcess.mockClear();
  });
  it('should load things', () => {
    const client = createClient();
    const manager = new ProcessManager(client);
    manager._load({});
    expect(manager);
  });

  it('should unload things', () => {
    const client = createClient();
    const manager = new ProcessManager(client);
    manager._load({id: 5});
    manager._unload(2);
    expect(manager);
  });
});
