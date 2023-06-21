'use strict';

const path = require('node:path');
const fsp = require('node:fs').promises;

const { LOG_DIR, SANDBOX_RUN_OPTIONS } = require('./systemConfig.js');
const common = require('./lib/common.js');
const console = require('./lib/logger.js')(LOG_DIR, process.cwd());
const { loadDir, createRouting } =
  require('./src/loader.js')(SANDBOX_RUN_OPTIONS);

const staticServer = require('./src/static.js');
const ws = require('./src/ws.js');

const sandbox = { console, common };

(async () => {
  /* There is future possibility to place multiple applications paths into the config file,
  that's why constant and file itself named in plural. But nowadays
  the logic has consider that only single path existed in the file! */
  const applications = await fsp.readFile('.applications', 'utf8');
  const appPath = path.join(process.cwd(), applications.trim());

  const configPath = path.join(appPath, './config');
  const config = await loadDir(configPath, sandbox);

  const db = require('./lib/db.js')(config.database);
  sandbox.db = Object.freeze(db);

  const apiPath = path.join(appPath, './api');
  const api = await loadDir(apiPath, sandbox, true);
  sandbox.api = api;
  const routing = createRouting(api);

  const staticPath = path.join(appPath, './static');
  const [port] = config.server.ports;
  const server = staticServer(staticPath, port, console);
  ws(routing, server, console);
})();
