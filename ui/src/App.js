import React from 'react';
import map from 'lodash/fp/map';
import flow from 'lodash/fp/flow';
import values from 'lodash/fp/values';
import filter from 'lodash/fp/filter';
import {connect} from 'react-redux';
import classNames from 'classnames';

const Asset = ({name, old, publicPath}) => (
  <li
    className={classNames({
      old,
    })}
  >
    <a href={`${publicPath}${name}`}>{name}</a>
  </li>
);

const Assets = ({assets, publicPath}) => (
  <div>
    <h2>Assets</h2>
    <ul>
      {map((asset) => (
        <Asset
          publicPath={publicPath}
          {...asset}
          key={asset.name}
        />
      ), assets)}
    </ul>
  </div>
);

const Routes = ({routes}) => (
  <ul>
    {map(({path, url}) => (
      <li>
        <a href={path}>{path}</a> <i className='fa fa-arrow-right'/> {url}
      </li>
    ), routes)}
  </ul>
);

const ErrorThing = ({errors}) => (
  <span className='errors'>
    <i className='fa fa-exclamation-circle'/> {errors.length}
  </span>
);

const WarningThing = ({warnings}) => (
  <span className='warnings'>
    <i className='fa fa-exclamation-triangle'/> {warnings.length}
  </span>
);

const StatsItem = (({
  token,
  hash,
  assets,
  publicPath,
  routes,
  errors,
  compiling,
  warnings,
  file,
}) => (
  <div
    className={classNames({
      errors: errors.length > 0,
      warnings: warnings.length > 0,
      instance: true,
    })}
  >
    <h1>webpack</h1>
    <div>
      <ErrorThing errors={errors}/> <WarningThing warnings={warnings}/>
    </div>
    <div className='byline'>
      {file}
      <br/>
      compilation token: {token}
      <br/>
      hash: {hash}
    </div>
    <h2>Routes</h2>
    <Routes routes={routes}/>
    {!compiling
      ? <Assets publicPath={publicPath} assets={assets}/>
      : 'Compiling...'
    }
  </div>
));

const List = (({stats}) => {
  return (
    <div>
      {map((props) => <StatsItem {...props} key={props.token}/>, stats)}
    </div>
  );
});

const App = connect(({stats, routes}) => {
  const result = flow(
    values,
    map((stats) => ({
      ...stats,
      routes: filter({token: stats.token}, routes),
    }))
  )(stats);
  return {stats: result};
})(List);

export default App;
