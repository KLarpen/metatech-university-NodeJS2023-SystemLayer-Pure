'use strict';

const http = require('node:http');

const HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Content-Length',
  'Access-Control-Max-Age': 60, // 1 min of options caching
  'Content-Type': 'application/json; charset=UTF-8',
};

const receiveArgs = async (req) => {
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const data = Buffer.concat(buffers).toString();
  return JSON.parse(data);
};

module.exports = (routing, port, { console, allowedClientOrigins }) => {
  const describeOptions = (res) => res.writeHead(204, HEADERS).end();
  const notFound = (res) => res.writeHead(200, HEADERS).end('"Not found"');

  http
    .createServer(async (req, res) => {
      const { url, socket, method: httpMethod } = req;
      // CORS header to allow the web client from different port/origin to communicate with API
      const originAllowed = allowedClientOrigins.some(
        (item) => req.headers.origin === `http://${item.host}:${item.port}`,
      );
      res.setHeader(
        'Access-Control-Allow-Origin',
        originAllowed ? req.headers.origin : 'http://127.0.0.1',
      );
      // Handle OPTIONS preflight request
      if (httpMethod === 'OPTIONS') return describeOptions(res);
      if (httpMethod !== 'POST') return notFound(res);

      // Resolve API request handler
      const [place, name, method] = url.substring(1).split('/');
      if (place !== 'api') return notFound(res);
      const entity = routing[name];
      if (!entity) return notFound(res);
      const handler = entity[method];
      if (!handler) return notFound(res);

      // Prepare data for API handler
      let resultBody = '';
      const { args } = await receiveArgs(req);
      console.log(`${socket.remoteAddress} ${method} ${url}`);
      try {
        const result = await handler(...args);
        resultBody = JSON.stringify(result);
      } catch (err) {
        console.error(err);
        resultBody = JSON.stringify([
          {
            error: {
              message: err.message,
            },
          },
        ]);
      }

      // Construct final response
      res.setHeader('Content-Length', Buffer.byteLength(resultBody));
      res.writeHead(200, HEADERS).end(resultBody);
    })
    .listen(port);

  console.log(`HTTP API on port ${port}`);
};
