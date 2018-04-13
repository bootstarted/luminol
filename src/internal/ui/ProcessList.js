import * as React from 'react';
import {Query} from 'react-apollo';
import gql from 'graphql-tag';
import bytes from 'bytes';
import Table from './Table';

const PROCESS_QUERY = gql`
  query Processes {
    processes {
      id
      path
      title
      args
      status
      pid
      cpu
      memory
    }
  }
`;

const PROCESS_SUBSCRIPTION = gql`
  subscription processes {
    processRegistered {
      id
      path
      title
      args
      status
      pid
      cpu
      memory
    }
  }
`;

class ProcessList extends React.PureComponent {
  componentDidMount() {
    const {subscribeToMore} = this.props;
    subscribeToMore();
  }
  render() {
    const {processes, subscribeToMore: _, ...rest} = this.props;
    return (
      <Table {...rest} header={['PID', 'Status', 'CPU', 'Memory', 'Title']}>
        {processes.map((proc) => {
          return (
            <Table.TR key={proc.id} value={proc.id}>
              <Table.TD>{proc.pid}</Table.TD>
              <Table.TD>{proc.status || 'UNKNOWN'}</Table.TD>
              <Table.TD>
                {typeof proc.cpu === 'number' ? proc.cpu.toFixed(2) : '-'}
              </Table.TD>
              <Table.TD>
                {typeof proc.memory === 'number' ? bytes(proc.memory) : '-'}
              </Table.TD>
              <Table.TD>{proc.title}</Table.TD>
            </Table.TR>
          );
        })}
      </Table>
    );
  }
}

export default (props) => (
  <Query query={PROCESS_QUERY}>
    {({data, loading, error, subscribeToMore}) => {
      if (loading || error) {
        return null;
      }
      return (
        <ProcessList
          {...props}
          processes={data.processes || []}
          subscribeToMore={() => {
            subscribeToMore({
              document: PROCESS_SUBSCRIPTION,
              updateQuery: (prev, {subscriptionData}) => {
                if (!subscriptionData.data) {
                  return prev;
                }
                let found = false;
                const next = prev.processes.map((proc) => {
                  if (proc.id === subscriptionData.data.processRegistered.id) {
                    found = true;
                    return {
                      ...proc,
                      ...subscriptionData.data.processRegistered,
                    };
                  }
                  return proc;
                });
                if (!found) {
                  next.push(subscriptionData.data.processRegistered);
                }
                return {
                  ...prev,
                  processes: next,
                };
              },
            });
          }}
        />
      );
    }}
  </Query>
);
