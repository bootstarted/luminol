import {PUT_STATS, COMPILE, PUT_ROUTE} from './types';
import {handleActions} from 'redux-actions';

export default handleActions({
  [PUT_STATS]: (state, {payload: stats}) => {
    return {
      ...state,
      stats: {
        ...state.stats,
        [stats.token]: {
          ...stats,
          compiling: false,
        },
      },
    };
  },
  [PUT_ROUTE]: (state, {payload: route}) => {
    return {
      ...state,
      routes: {
        ...state.routes,
        [route.path]: route,
      },
    };
  },
  [COMPILE]: (state, {payload: stats}) => {
    const previous = state.stats[stats.token];
    return {
      ...state,
      stats: {
        ...state.stats,
        [stats.token]: previous ? {
          ...previous,
          compiling: true,
        } : {
          errors: [],
          warnings: [],
          assets: [],
          ...stats,
        },
      },
    };
  },
}, {
  stats: {},
  routes: {},
});
