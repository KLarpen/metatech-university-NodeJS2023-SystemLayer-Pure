'use strict';

module.exports = ({ serviceKey, logPath, appRootPath }) => {
  if (serviceKey === 'native') return console;
  else {
    const Logger = require(`./${serviceKey}.js`);
    return new Logger(logPath, appRootPath);
  }
};
