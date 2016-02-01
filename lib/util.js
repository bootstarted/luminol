export const kill = (child, cb = () => {}) => {
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
