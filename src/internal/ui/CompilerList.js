import * as React from 'react';
import {Query} from 'react-apollo';
import gql from 'graphql-tag';

import Table from './Table';

const COMPILER_QUERY = gql`
  query CompilersQuery {
    compilers {
      id
      status
      hash
    }
  }
`;

const COMPILER_SUBSCRIPTION = gql`
  subscription CompilersSubscription {
    compilerUpdated {
      id
      status
      hash
    }
  }
`;

class CompilerList extends React.Component {
  componentDidMount() {
    const {subscribeToMore} = this.props;
    subscribeToMore();
  }
  render() {
    const {compilers} = this.props;
    return (
      <Table header={['ID', 'Status', 'Hash']}>
        {compilers.map(({id, status, hash}) => {
          return (
            <Table.TR key={id} value={id}>
              <Table.TD>{id}</Table.TD>
              <Table.TD>{status}</Table.TD>
              <Table.TD>{hash}</Table.TD>
            </Table.TR>
          );
        })}
      </Table>
    );
  }
}

export default () => (
  <Query query={COMPILER_QUERY}>
    {({data, loading, error, subscribeToMore}) => {
      if (loading || error) {
        return null;
      }
      return (
        <CompilerList
          compilers={data.compilers || []}
          subscribeToMore={() => {
            subscribeToMore({
              document: COMPILER_SUBSCRIPTION,
              updateQuery: (prev, {subscriptionData}) => {
                if (!subscriptionData.data) {
                  return prev;
                }
                let found = false;
                const next = prev.compilers.map((compiler) => {
                  if (
                    compiler.id === subscriptionData.data.compilerUpdated.id
                  ) {
                    found = true;
                    return {
                      ...compiler,
                      ...subscriptionData.data.compilerUpdated,
                    };
                  }
                  return compiler;
                });
                if (!found) {
                  next.push(subscriptionData.data.compilerUpdated);
                }
                return {
                  ...prev,
                  compilers: next,
                };
              },
            });
          }}
        />
      );
    }}
  </Query>
);
