import * as React from 'react';
import {Query} from 'react-apollo';
import gql from 'graphql-tag';

import Table from './Table';

const PROXY_QUERY = gql`
  query Proxies {
    proxies {
      id
      url
      path
      enabled
    }
  }
`;

const PROXY_SUBSCRIPTION = gql`
  subscription proxies {
    proxyRegistered {
      id
      url
      path
      enabled
    }
  }
`;

class ProxyList extends React.Component {
  componentDidMount() {
    const {subscribeToMore} = this.props;
    subscribeToMore();
  }
  render() {
    const {proxies} = this.props;
    return (
      <Table tags header={['Enabled', 'Path', 'URL']}>
        {proxies.map((proxy) => (
          <Table.TR key={proxy.id} value={proxy.id}>
            <Table.TD>
              {proxy.enabled ? '{green-bg} Y {/green-bg}' : 'N'}
            </Table.TD>
            <Table.TD>{proxy.path}</Table.TD>
            <Table.TD>{proxy.url}</Table.TD>
          </Table.TR>
        ))}
      </Table>
    );
  }
}

export default () => (
  <Query query={PROXY_QUERY}>
    {({data, loading, error, subscribeToMore}) => {
      if (loading || error) {
        return null;
      }
      return (
        <ProxyList
          proxies={data.proxies || []}
          subscribeToMore={() => {
            subscribeToMore({
              document: PROXY_SUBSCRIPTION,
              updateQuery: (prev, {subscriptionData}) => {
                if (!subscriptionData.data) {
                  return prev;
                }
                let found = false;
                const next = prev.proxies.map((proxy) => {
                  if (proxy.id === subscriptionData.data.proxyRegistered.id) {
                    found = true;
                    return {
                      ...proxy,
                      ...subscriptionData.data.proxyRegistered,
                    };
                  }
                  return proxy;
                });
                if (!found) {
                  next.push(subscriptionData.data.proxyRegistered);
                }
                return {
                  ...prev,
                  proxies: next,
                };
              },
            });
          }}
        />
      );
    }}
  </Query>
);
