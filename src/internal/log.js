import gql from 'graphql-tag';

const LOG_MUTATION = gql`
  mutation log($message: String!) {
    log(message: $message)
  }
`;

const log = (client, message) => {
  client.mutate({
    mutation: LOG_MUTATION,
    variables: {
      message,
    },
  });
};

export default log;
