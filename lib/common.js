'use strict';

const crypto = require('node:crypto');

module.exports = (config) => {
  const hash = (password) =>
    new Promise((resolve, reject) => {
      const salt = crypto
        .randomBytes(config.HASHING.saltLength)
        .toString('base64');
      crypto.scrypt(password, salt, config.HASHING.keyLength, (err, result) => {
        if (err) reject(err);
        resolve(salt + ':' + result.toString('base64'));
      });
    });

  // Export configured `common` module
  return { hash };
};
