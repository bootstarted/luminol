import {Client} from 'faye';
import join from 'url-join';

const start = () => {
  const url = process.env.IPC_URL;
  if (typeof url === 'string') {
    return new Client(join(process.env.IPC_URL, '__webpack_udev_socket'));
  }
  throw new Error('No IPC_URL defined!');
};

export default start();
