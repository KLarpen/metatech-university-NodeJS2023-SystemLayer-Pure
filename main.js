'use strict';

const fsp = require('node:fs').promises;
const path = require('node:path');

const systemConfig = require('./systemConfig.js');
const common = require('./lib/common.js')(systemConfig);
const load = require('./src/load.js')(systemConfig.SANDBOX_RUN_OPTIONS);
const staticServer = require('./src/static.js');

const appPath = path.join(process.cwd(), systemConfig.APPLICATION);
const apiPath = path.join(appPath, './api');
const configPath = path.join(appPath, './config.js');
const staticPath = path.join(appPath, './static');

const config = require(configPath);
const db = require('./lib/db.js')(config.DB);
const logger = require('./lib/logger/provider.js')({
  ...config.LOGGER,
  /** Absolute path to the application root folder to filter out from stack traces */
  appRootPath: appPath,
});

const server = require(`./src/transport/${config.transport}.js`);

const sandbox = {
  api: Object.freeze({}),
  db: Object.freeze(db),
  console: Object.freeze(logger),
  common: Object.freeze(common),
};

const routing = {};

(async () => {
  const files = await fsp.readdir(apiPath);
  for (const fileName of files) {
    if (!fileName.endsWith('.js')) continue;
    const filePath = path.join(apiPath, fileName);
    const serviceName = path.basename(fileName, '.js');
    routing[serviceName] = await load(filePath, Object.freeze({ ...sandbox }));
    logger.log(
      'Service { name: %s, methods: [%s] }',
      serviceName,
      Object.keys(routing[serviceName]).join(', '),
    );
  }

  staticServer(staticPath, config.SERVERS.static.port, sandbox.console);
  server(routing, config.SERVERS[config.transport].port, {
    console: sandbox.console,
    allowedClientOrigins: [config.SERVERS.static],
  });
})();
