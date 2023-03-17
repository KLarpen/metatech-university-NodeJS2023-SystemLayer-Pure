'use strict';

const crypto = require('node:crypto');

const SALT_LEN = 32;
const KEY_LEN = 64;

const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LEN).toString('base64');
    crypto.scrypt(password, salt, KEY_LEN, (err, result) => {
      if (err) reject(err);
      resolve(salt + ':' + result.toString('base64'));
    });
  });

module.exports = { hashPassword };
