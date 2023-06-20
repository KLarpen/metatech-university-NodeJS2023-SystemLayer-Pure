'use strict';

const path = require('node:path');

const {
  LOG_DIR,
  SANDBOX_RUN_OPTIONS,
  APPLICATION,
} = require('./systemConfig.js');
const common = require('./lib/common.js');
const logger = require('./lib/logger.js')(LOG_DIR, process.cwd());
const { loadDir } = require('./src/loader.js')(SANDBOX_RUN_OPTIONS);

const staticServer = require('./src/static.js');
const ws = require('./src/ws.js');

const appPath = path.join(process.cwd(), APPLICATION);
const apiPath = path.join(appPath, './api');
const configPath = path.join(appPath, './config');
const staticPath = path.join(appPath, './static');

(async () => {
  const sandbox = {
    console: Object.freeze(logger),
    common: Object.freeze(common),
  };

  const config = await loadDir(configPath, sandbox);
  const db = require('./lib/db.js')(config.database);

  sandbox.api = Object.freeze({});
  sandbox.db = Object.freeze(db);

  const routing = await loadDir(apiPath, sandbox, true);

  const [port] = config.server.ports;
  const server = staticServer(staticPath, port, logger);
  ws(routing, server, logger);
})();
