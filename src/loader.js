'use strict';

const fsp = require('node:fs').promises;
const path = require('node:path');
const vm = require('node:vm');

module.exports = (options) => {
  const load = async (
    filePath,
    sandboxProto,
    settings = {
      commonSandbox: false,
      contextualize: false,
    },
  ) => {
    const src = await fsp.readFile(filePath, 'utf8');
    const opening = settings.contextualize ? '(context) => ' : '';
    const code = `'use strict';\n${opening}${src}`;
    const script = new vm.Script(code, { filename: filePath, lineOffset: -1 });
    const sandbox = settings.commonSandbox
      ? sandboxProto
      : Object.freeze({ ...sandboxProto });
    const context = vm.createContext(sandbox);
    return script.runInContext(context, options);
  };

  const loadDir = async (
    dir,
    sandbox,
    settings = {
      commonSandbox: false,
      contextualize: false,
      deepFreeze: false,
    },
  ) => {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const container = {};
    for (const entry of entries) {
      const { name } = entry;
      if (entry.isFile() && !name.endsWith('.js')) continue;
      const location = path.join(dir, name);
      const key = path.basename(name, '.js');
      const loader = entry.isFile() ? load : loadDir;
      container[key] = await loader(location, sandbox, settings);
    }
    return settings.deepFreeze ? Object.freeze(container) : container;
  };

  const createRouting = (container, path = '', routing = new Map()) => {
    for (const [key, value] of Object.entries(container)) {
      const location = path ? `${path}.${key}` : key;
      if (typeof value === 'function') routing.set(location, value);
      else createRouting(value, location, routing);
    }
    return routing;
  };

  return { load, loadDir, createRouting };
};
