import * as React from 'react';
import {Query} from 'react-apollo';
import gql from 'graphql-tag';

const PROCESS_QUERY = gql`
  query process($id: ID!) {
    process(processId: $id) {
      id
      path
      logs(encoding: UTF8) {
        data
      }
    }
  }
`;

class Process extends React.Component {
  render() {
    const {process} = this.props;
    const logStream = process.logs.map(({data}) => data).join('');
    return (
      <box scrollable alwaysScroll interactive mouse keys height="50%">
        {logStream}
      </box>
    );
  }
}

export default ({id}) => (
  <Query query={PROCESS_QUERY} variables={{id}}>
    {({data, loading, error}) => {
      if (loading || error) {
        return null;
      }
      return <Process process={data.process} />;
    }}
  </Query>
);
