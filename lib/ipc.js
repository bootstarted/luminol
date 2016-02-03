import client from 'socket.io-client';

const start = () => {
  if (process.env.IPC_URL) {
    const io = client(process.env.IPC_URL);
    return io;
  }
  throw new Error('No IPC_URL defined!');
};

export default start();
