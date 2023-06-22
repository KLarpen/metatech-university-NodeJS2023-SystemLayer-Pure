'use strict';

const path = require('node:path');
const fsp = require('node:fs').promises;

const { LOG_DIR, SANDBOX_RUN_OPTIONS } = require('./systemConfig.js');
const common = require('./lib/common.js');
const console = require('./lib/logger.js')(LOG_DIR, process.cwd());
const { loadDir, createRouting } =
  require('./src/loader.js')(SANDBOX_RUN_OPTIONS);
const { Server } = require('./src/server.js');

/**
 * Sandbox Base object with some nulled properties
 * to reserve it's shape and namespaces
 */
const sandbox = {
  console,
  common,
  application: null,
  config: null,
  db: null,
  lib: null,
  domain: null,
  api: null,
};

(async () => {
  /* There is future possibility to place multiple applications paths into the config file,
  that's why constant and file itself named in plural. But nowadays
  the logic has consider that only single path existed in the file! */
  const applications = await fsp.readFile('.applications', 'utf8');
  const appPath = path.join(process.cwd(), applications.trim());
  sandbox.application = Object.freeze({ path: appPath });

  const configPath = path.join(appPath, './config');
  const config = await loadDir(configPath, sandbox);
  sandbox.config = Object.freeze(config);

  const db = require('./lib/db.js')(config.database);
  sandbox.db = Object.freeze(db);

  const libPath = path.join(appPath, './lib');
  const lib = await loadDir(libPath, sandbox);
  sandbox.lib = Object.freeze(lib);

  const domainPath = path.join(appPath, './domain');
  const domain = await loadDir(domainPath, sandbox);
  sandbox.domain = Object.freeze(domain);

  const apiPath = path.join(appPath, './api');
  const api = await loadDir(apiPath, sandbox, true);
  sandbox.api = Object.freeze(api);
  const routing = createRouting(api);

  const application = { path: appPath, console, routing, config, server: null };
  application.server = new Server(application);
})();
