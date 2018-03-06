// @flow
import {createClient} from '/hub';
import createRuntime from './createRuntime';
import {parseResourceQuery} from './util';
import createLogger from './createLogger';

declare var __resourceQuery: string;

const {hubUrl, name} = parseResourceQuery(__resourceQuery);
const hub = createClient(hubUrl);

const internalHub = createRuntime({
  name,
  hub,
  reload() {
    console.log('🔥  Requested full reload. Reload window to see changes.');
    // TODO: Consider what to do about this scenario.
    // window.location.reload();
  },
});

createLogger(internalHub);
