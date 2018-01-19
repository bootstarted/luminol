/* @flow */
type Handlers = {
  [string]: (a: any, b: any) => void,
};

const handleMessage = (
  handlers: Handlers,
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
