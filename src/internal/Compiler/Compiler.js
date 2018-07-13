// @flow
import resolve from 'resolve';
import createDebug from '/internal/createDebug';

const debug = createDebug('compiler');

type ParsedConfig = {
  path: string,
  type: string,
};

class Compiler {
  client: Client;
  url: string;

  constructor(client: Client, url: string) {
    this.client = client;
    this.url = url;
  }
  _parseConfig(config: string): ParsedConfig {
    const parts = config.split(':', 2);
    if (parts.length > 1) {
      return {path: parts[1], type: parts[0]};
    }
    const result = /\.?([^.]+)\.config\./.exec(config);
    if (result) {
      return {path: config, type: result[1]};
    }
    throw new Error('Unable to determine type of config.');
  }

  _loadModule(path: string) {
    const result = require(path);
    if (result && result.__esModule) {
      return result.default;
    }
    return result;
  }

  runConfig(config: string) {
    const {path, type} = this._parseConfig(config);
    debug(`Loading handler for ${type} config`);
    const handler = this._loadModule(`luminol-${type}`);
    const resolved = resolve.sync(path, {
      basedir: process.cwd(),
    });
    debug(`Loading config ${resolved}`);
    handler(resolved, {url: this.url, client: this.client});
  }
}

export default Compiler;
