import {PUT_STATS, COMPILE, PUT_ROUTE} from './types';
import {createAction} from 'redux-actions';

export const putStats = createAction(PUT_STATS);
export const putRoute = createAction(PUT_ROUTE);
export const compile = createAction(COMPILE);
