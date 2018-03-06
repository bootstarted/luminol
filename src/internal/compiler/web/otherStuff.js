// @flow
import {listen} from 'midori';
import {proxySet} from '/action/proxy';
import serveCompilerOutput from './serveCompilerOutput';
import hook from '../hook';

import type {Hub, WebpackCompiler} from '/types';

export default (hub: Hub, compiler: WebpackCompiler) => {
  const server = listen(
    serveCompilerOutput(compiler)
  );
  const publicPath = compiler.options.output.publicPath;

  hook(compiler, 'compile', () => {
    hub.dispatch(proxySet({
      path: publicPath,
    }));
  });

  hook(compiler, 'done', () => {
    const address = server.address();
    if (address) {
      hub.dispatch(proxySet({
        url: `http://localhost:${address.port}${publicPath}`,
        path: publicPath,
      }));
    }
  });

  return () => {
    // TODO: Uninstall hooks
    server.close();
  };
};
