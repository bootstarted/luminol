import * as React from 'react';

class TR {
  render() {
    return this.props.children;
  }
}

class TD {
  render() {
    return this.props.children;
  }
}

class Table extends React.PureComponent {
  static TR = TR;
  static TD = TD;
  static defaultProps = {
    wrap: false,
  };
  state = {focus: false};
  tableRef;
  values = [];
  _handleBlur = () => {
    this.setState({focus: false});
  };
  _handleFocus = () => {
    this.setState({focus: true});
  };
  _findIndexFromValue(x) {
    return this.values.indexOf(x);
  }
  _findValueFromIndex(x) {
    return this.values[x];
  }
  _count() {
    const {children} = this.props;
    return React.Children.count(children);
  }
  _up() {
    if (!this.props.onChange) {
      return;
    }
    const {wrap} = this.props;
    let newIndex = this._currentIndex() - 1;
    if (newIndex < 0) {
      newIndex = wrap ? this._count() - 1 : this._currentIndex();
    }
    this.props.onChange(this._findValueFromIndex(newIndex));
  }
  _down() {
    if (!this.props.onChange) {
      return;
    }
    const {wrap} = this.props;
    let newIndex = this._currentIndex() + 1;
    if (newIndex >= this._count()) {
      newIndex = wrap ? 0 : this._currentIndex();
    }
    this.props.onChange(this._findValueFromIndex(newIndex));
  }
  _currentIndex() {
    return this._findIndexFromValue(this.props.value);
  }
  componentDidMount() {
    this.tableRef.select(0);
    this.tableRef.on('keypress', (ch, key) => {
      if (key.name === 'up') {
        this._up();
      } else if (key.name === 'down') {
        this._down();
      }
    });
    this.tableRef.screen._listenMouse(this.tableRef);
    this.tableRef.on('element wheeldown', () => {
      this._down();
    });
    this.tableRef.on('element wheelup', () => {
      this._up();
    });
  }
  componentDidUpdate() {
    this.values = React.Children.map(this.props.children, (x) => {
      return x.props.value;
    });
    this.tableRef.select(this._currentIndex() + 1);
  }
  render() {
    const {children, header, ...rest} = this.props;
    const {focus} = this.state;
    const rows = [
      header,
      ...React.Children.toArray(children)
        .map((child) => {
          if (!child) {
            return null;
          }
          return React.Children.toArray(child.props.children).map((child) => {
            if (child && child.props) {
              return (child.props.children || '').toString();
            }
            return '';
          });
        })
        .filter((x) => !!x),
    ];
    return (
      <listtable
        onFocus={this._handleFocus}
        onBlur={this._handleBlur}
        ref={(x) => (this.tableRef = x)}
        interactive
        style={{
          selected: {
            bg: focus ? 'blue' : 'grey',
            fg: 'white',
            bold: true,
          },
          header: {
            fg: 'blue',
            bold: true,
          },
        }}
        clickable
        align="left"
        height="100%-2"
        rows={rows}
        {...rest}
      />
    );
  }
}

export default Table;
