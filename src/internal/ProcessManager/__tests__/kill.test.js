import kill from '/internal/ProcessManager/kill';

describe('/ProcessManager/kill', () => {
  let pkill;
  let ponce;
  beforeEach(() => {
    jest.useFakeTimers();
    pkill = jest.spyOn(process, 'kill');
    ponce = jest.spyOn(process, 'once');
  });
  afterEach(() => {
    pkill.mockRestore();
    ponce.mockRestore();
  });
  it('should do nothing if the child is dead', () => {
    const spy = jest.fn();
    pkill.mockReturnValue(0);
    kill({}, spy);
  });
  it('should try to use SIGINT first', () => {
    const spy = jest.fn();
    let onExit;
    const child = {once: jest.fn(), kill: jest.fn()};
    child.once.mockImplementation((name, handler) => {
      if (name === 'exit') {
        onExit = handler;
      }
    });
    child.kill.mockImplementation(() => onExit && onExit());
    pkill.mockReturnValue(1);
    kill(child, spy);
  });
  it('should send `SIGTERM` on timeout', () => {
    const spy = jest.fn();
    const child = {once: jest.fn(), kill: jest.fn()};
    pkill.mockReturnValue(1);
    ponce.mockImplementation(() => {});
    kill(child, spy);
    jest.runAllTimers();
    expect(child.kill).toHaveBeenCalled();
  });
});
