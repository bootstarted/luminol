import {compose, header, send, match} from 'midori';

export default compose(
  header('Access-Control-Allow-Origin', '*'),
  match(
    match.method('OPTIONS'),
    send(
      204,
      {
        'Access-Control-Allow-Methods': ['GET', 'POST', 'OPTIONS'].join(' '),
        'Access-Control-Allow-Headers': [
          'Content-Type',
          'X-Apollo-Tracing',
        ].join(', '),
      },
      '',
    ),
  ),
);
