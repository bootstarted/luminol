import * as React from 'react';
import {ApolloProvider} from 'react-apollo';

import Header from './Header';
import ProxyList from './ProxyList';
import ProcessList from './ProcessList';
import CompilerList from './CompilerList';
import RequestLog from './RequestLog';

import Process from './Process';

class AppRoot extends React.Component {
  state = {selected: null};
  _handleSelect = (item) => {
    this.setState({selected: item && item.id});
  };
  render() {
    const {client} = this.props;
    const {selected} = this.state;
    return (
      <ApolloProvider client={client}>
        <box>
          <Header />
          <box>{selected && <Process id={selected} />}</box>
          <box top={'50%'}>
            <box
              top="0"
              left="0"
              width="50%"
              height="50%"
              border={{type: 'line'}}
              style={{border: {fg: 'blue'}}}
            >
              <ProcessList
                value={this.state.selected}
                onChange={(v) => {
                  this.setState({selected: v});
                }}
              />
            </box>

            <box
              top="50%"
              left="0"
              width="50%"
              height="50%"
              border={{type: 'line'}}
              style={{border: {fg: 'blue'}}}
            >
              <RequestLog />
            </box>
            <box
              top="0"
              left="50%"
              width="50%"
              height="50%"
              border={{type: 'line'}}
              style={{border: {fg: 'blue'}}}
            >
              <ProxyList />
            </box>
            <box
              top="50%"
              left="50%"
              width="50%"
              height="50%"
              border={{type: 'line'}}
              style={{border: {fg: 'blue'}}}
            >
              <CompilerList />
            </box>
          </box>
        </box>
      </ApolloProvider>
    );
  }
}

export default AppRoot;
