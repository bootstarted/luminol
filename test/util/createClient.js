/* global jest */
const createClient = () => {
  return {
    mutate: jest.fn(),
    watchQuery: () => {
      return {
        subscribe: () => {},
        subscribeToMore: () => {},
      };
    },
  };
};

// eslint-disable-next-line metalab/import/no-commonjs
module.exports = createClient;
