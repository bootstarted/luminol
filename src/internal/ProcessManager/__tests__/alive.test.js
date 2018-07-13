import alive from '/internal/ProcessManager/alive';

describe('/ProcessManager/alive', () => {
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
  it('should return true if process responds to SIG0', () => {
    pkill.mockReturnValue(1);
    expect(alive({})).toBe(true);
  });
  it('should return false if process fails to respond to SIG0', () => {
    const err = new Error('EPERM');
    err.code = 'EPERM';
    pkill.mockImplementation(() => {
      throw err;
    });
    expect(alive({})).toBe(false);
  });
  it('should fail on other errors', () => {
    pkill.mockImplementation(() => {
      throw new TypeError('Random error');
    });
    expect(() => alive({})).toThrow(TypeError);
  });
});
