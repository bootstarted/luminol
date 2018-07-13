import * as React from 'react';
import {Query} from 'react-apollo';
import gql from 'graphql-tag';

import Table from './Table';

const REQUEST_QUERY = gql`
  query Requests {
    requests {
      id
      method
      statusCode
      url
      time
    }
  }
`;

const REQUEST_SUBSCRIPTION = gql`
  subscription proxies {
    requestProcessed {
      id
      method
      statusCode
      url
      time
    }
  }
`;

class RequestLog extends React.Component {
  componentDidMount() {
    const {subscribeToMore} = this.props;
    subscribeToMore();
    // this.table.setScrollPerc(100);
  }
  componentDidUpdate() {
    // this.table.setScrollPerc(100);
  }
  render() {
    const {requests} = this.props;
    return (
      <Table header={['Method', 'Status', 'URL', 'Time']}>
        {requests.map((req) => {
          return (
            <Table.TR key={req.id} value={req.id}>
              <Table.TD>{req.method}</Table.TD>,
              <Table.TD>{req.statusCode}</Table.TD>
              <Table.TD>{req.url}</Table.TD>
              <Table.TD>{req.time ? `${req.time.toFixed(2)}ms` : ''}</Table.TD>
            </Table.TR>
          );
        })}
      </Table>
    );
  }
}

export default () => (
  <Query query={REQUEST_QUERY}>
    {({data, loading, error, subscribeToMore}) => {
      if (loading || error) {
        return null;
      }
      return (
        <RequestLog
          requests={data.requests || []}
          subscribeToMore={() => {
            subscribeToMore({
              document: REQUEST_SUBSCRIPTION,
              updateQuery: (prev, {subscriptionData}) => {
                if (!subscriptionData.data) {
                  return prev;
                }
                let found = false;
                const next = prev.requests.map((req) => {
                  if (req.id === subscriptionData.data.requestProcessed.id) {
                    found = true;
                    return {
                      ...req,
                      ...subscriptionData.data.requestProcessed,
                    };
                  }
                  return req;
                });
                if (!found) {
                  next.push(subscriptionData.data.requestProcessed);
                }
                return {
                  ...prev,
                  requests: next,
                };
              },
            });
          }}
        />
      );
    }}
  </Query>
);
