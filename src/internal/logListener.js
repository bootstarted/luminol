import gql from 'graphql-tag';

const LOG_SUBSCRIPTION = gql`
  subscription logReceived {
    logReceived {
      message
    }
  }
`;

const logListener = (client, fn) => {
  const query = client.subscribe({
    query: LOG_SUBSCRIPTION,
  });
  return query.subscribe({
    next: (data) => fn(data.logReceived),
  });
};

export default logListener;
