// @flow
import alive from './alive';

type Callback = () => void;

const kill = (child: child_process$ChildProcess, cb: Callback = () => {}) => {
  if (!alive(child)) {
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

export default kill;
