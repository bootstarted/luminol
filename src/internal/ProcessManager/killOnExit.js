// @flow
import alive from './alive';
import kill from './kill';

const killOnExit = (child: child_process$ChildProcess) => {
  process.once('exit', () => {
    if (alive(child)) {
      child.kill('SIGTERM');
    }
  });
  process.once('beforeExit', () => {
    kill(child);
  });
};

export default killOnExit;
