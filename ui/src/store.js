import {createStore, compose, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import reducer from './reducer';

export default (initialState) => compose(
  applyMiddleware(thunk),
  window.devToolsExtension ? window.devToolsExtension() : (f) => f
)(createStore)(reducer, initialState);
