'use strict';

const path = require('node:path');

const systemConfig = require('./systemConfig.js');
const common = require('./lib/common.js')(systemConfig);
const logger = require('./lib/logger.js')(systemConfig.LOG_DIR, process.cwd());
const { load, loadDir } = require('./src/load.js')(
  systemConfig.SANDBOX_RUN_OPTIONS,
);

const staticServer = require('./src/static.js');
const ws = require('./src/ws.js');

const appPath = path.join(process.cwd(), systemConfig.APPLICATION);
const apiPath = path.join(appPath, './api');
const configPath = path.join(appPath, './config.js');
const staticPath = path.join(appPath, './static');

(async () => {
  const sandbox = {
    console: Object.freeze(logger),
    common: Object.freeze(common),
  };

  const config = await load(configPath, sandbox);
  const db = require('./lib/db.js')(config.DB);

  sandbox.api = Object.freeze({});
  sandbox.db = Object.freeze(db);

  const routing = await loadDir(apiPath, sandbox);

  const port = config.SERVERS.static.port;
  const server = staticServer(staticPath, port, logger);
  ws(routing, server, logger);
})();
