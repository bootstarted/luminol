import killOnExit from '/internal/ProcessManager/killOnExit';

describe('/ProcessManager/killOnExit', () => {
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
  it('should try to gracefully kill the process on `beforeExit`', () => {
    pkill.mockReturnValue(0);
    ponce.mockImplementation((name, handler) => {
      if (name === 'beforeExit') {
        handler();
      }
    });
    killOnExit({});
  });
  it('should forcefully kill the process on `exit`', () => {
    const child = {kill: jest.fn()};
    ponce.mockImplementation((name, handler) => {
      if (name === 'exit') {
        handler();
      }
    });
    pkill.mockReturnValue(1);
    killOnExit(child);
  });
});
