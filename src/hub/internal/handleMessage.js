// @flow

const handleMessage = <T: {[string]: (p: *, m?: *) => void}>(
  handlers: T,
  data: string
): boolean => {
  try {
    const {type, payload, meta} = JSON.parse(data);
    if (handlers[type]) {
      handlers[type](payload, meta);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export default handleMessage;
