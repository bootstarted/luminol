// @flow
import {request, response, timing, apply, pure, App} from 'midori';
import gql from 'graphql-tag';
import cuid from 'cuid';

import createDebug from '/internal/createDebug';
import type {Client} from '/types';

const debug = createDebug('server');

const requestProcessed = gql`
  mutation requestProcessed(
    $id: ID
    $statusCode: Int
    $method: String
    $url: String
    $time: Float
  ) {
    requestProcessed(
      id: $id
      statusCode: $statusCode
      method: $method
      url: $url
      time: $time
    )
  }
`;

// This whole chunk is a hack until midori provides away to do this pattern
// more effectively.
// $ExpectError
const createLogger = (client: Client): App => (app: *) => {
  // $ExpectError
  return apply(
    (fn) =>
      apply(request, (req) => {
        const id = cuid();
        client.mutate({
          mutation: requestProcessed,
          variables: {
            id,
            method: req.method,
            url: req.url,
          },
        });
        return fn(id);
      }),
    request,
    response,
    timing.headers,
    // $ExpectError
    (_fn) => (_p) => {
      return app;
    },
    (id, req, res, timing, x) => {
      debug(`request finished ${res.statusCode} ${req.method} ${req.url}`);
      client.mutate({
        mutation: requestProcessed,
        variables: {
          id: id,
          statusCode: res.statusCode,
          method: req.method,
          url: req.url,
          time: timing,
        },
      });
      return pure(x);
    },
  )(app);
};

export default createLogger;
