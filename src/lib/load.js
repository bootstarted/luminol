import {resolve, extname} from 'path';
import interpret from 'interpret';

const registerCompiler = (moduleDescriptor) => {
  if (moduleDescriptor) {
    if (typeof moduleDescriptor === 'string') {
      require(moduleDescriptor);
    } else if (!Array.isArray(moduleDescriptor)) {
      moduleDescriptor.register(require(moduleDescriptor.module));
    } else {
      for (let i = 0; i < moduleDescriptor.length; i++) {
        try {
          registerCompiler(moduleDescriptor[i]);
          break;
        } catch (e) {
          // do nothing
        }
      }
    }
  }
};

export default (entry) => {
  const extensions = Object.keys(interpret.extensions).sort(function(a, b) {
    return a.length - b.length;
  });
  const configPath = resolve(entry);
  let ext;
  for (let i = extensions.length - 1; i >= 0; i--) {
    const tmpExt = extensions[i];
    if (configPath.indexOf(tmpExt, configPath.length - tmpExt.length) > -1) {
      ext = tmpExt;
      break;
    }
  }
  if (!ext) {
    ext = extname(configPath);
  }
  registerCompiler(interpret.extensions[ext]);
  const value = require(configPath);
  if (value && value.__esModule) {
    return value.default;
  }
  return value;
};
