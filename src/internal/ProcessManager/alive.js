// @flow

const alive = (child: child_process$ChildProcess): boolean => {
  try {
    return !!process.kill(child.pid, 0);
  } catch (e) {
    if (e.code === 'EPERM' || e.code === 'ESRCH') {
      return false;
    }
    throw e;
  }
};

export default alive;
