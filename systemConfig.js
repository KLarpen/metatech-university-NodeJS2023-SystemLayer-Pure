//@ts-check
'use strict';

/**
 * Relative path to the domain application folder
 * @type {typeof import('systemConfig').APPLICATION}
 */
const APPLICATION = '../metatech-university-NodeJS2023-Application-metaschema';
/**
 * Path to the folder to store log files in. Relative path allowed
 * @type {typeof import('systemConfig').LOG_DIR}
 */
const LOG_DIR = './log';

/**
 * Sandboxes settings
 * @type {typeof import('systemConfig').SANDBOX_RUN_OPTIONS}
 */
const SANDBOX_RUN_OPTIONS = {
  timeout: 5000,
  displayErrors: false,
};

module.exports = {
  APPLICATION,
  LOG_DIR,
  SANDBOX_RUN_OPTIONS,
};
