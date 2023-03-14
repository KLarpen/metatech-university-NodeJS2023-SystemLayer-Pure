'use strict';

const fsp = require('node:fs').promises;
const path = require('node:path');
const vm = require('node:vm');

module.exports = (options) => {
  const load = async (filePath, sandbox) => {
    const src = await fsp.readFile(filePath, 'utf8');
    const code = `'use strict';\n${src}`;
    const script = new vm.Script(code, { filename: filePath, lineOffset: -1 });
    const context = vm.createContext(Object.freeze({ ...sandbox }));
    const exported = script.runInContext(context, options);
    return exported;
  };

  const loadDir = async (dir, sandbox) => {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const container = {};
    for (const entry of entries) {
      const { name } = entry;
      if (entry.isFile() && !name.endsWith('.js')) continue;
      const location = path.join(dir, name);
      const key = path.basename(name, '.js');
      const loader = entry.isFile() ? load : loadDir;
      container[key] = await loader(location, sandbox);
    }
    return container;
  };

  return { load, loadDir };
};
