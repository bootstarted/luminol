export const kill = (child, cb = () => {}) => {
  if (child.killed) {
    return;
  }
  let timeout = null;
  child.once('exit', () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    cb();
  });
  child.kill('SIGINT');
  timeout = setTimeout(() => {
    child.kill('SIGTERM');
    timeout = null;
  }, 3000);
};

export const killOnExit = (child) => {
  process.once('exit', () => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });
  process.once('beforeExit', () => {
    kill(child);
  });
};
