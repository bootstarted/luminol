// @flow
type Callback = () => void;

export const alive = (child: child_process$ChildProcess): boolean => {
  try {
    return !!process.kill(child.pid, 0);
  } catch (e) {
    return e.code === 'EPERM';
  }
};

export const kill = (
  child: child_process$ChildProcess,
  cb: Callback = () => {}
) => {
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

export const killOnExit = (child: child_process$ChildProcess) => {
  process.once('exit', () => {
    if (alive(child)) {
      child.kill('SIGTERM');
    }
  });
  process.once('beforeExit', () => {
    kill(child);
  });
};
