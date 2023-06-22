'use strict';

const http = require('node:http');
const path = require('node:path');
const fsp = require('node:fs').promises;
const ws = require('ws');
const { receiveBody, jsonParse } = require('../lib/common.js');
const {
  HttpTransport,
  WsTransport,
  MIME_TYPES,
  HEADERS,
} = require('./transport.js');

const serveStatic = (staticPath) => async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(staticPath, url);
  try {
    const data = await fsp.readFile(filePath);
    const fileExt = path.extname(filePath).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    res.writeHead(200, { ...HEADERS, 'Content-Type': mimeType });
    res.end(data);
  } catch (err) {
    res.statusCode = 404;
    res.end('"File is not found"');
  }
};

class Server {
  constructor(application) {
    this.application = application;
    const { console, routing, config } = application;
    this.console = console;
    this.routing = routing;
    const staticPath = path.join(application.path, './static');
    this.staticHandler = serveStatic(staticPath);
    this.httpServer = http.createServer();
    const [port] = config.server.ports;
    this.listen(port);
    console.log(`API on port ${port}`);
  }

  listen(port) {
    this.httpServer.on('request', async (req, res) => {
      if (!req.url.startsWith('/api')) {
        this.staticHandler(req, res);
        return;
      }

      const transport = new HttpTransport(this, req, res);
      const data = await receiveBody(req);
      this.rpc(transport, data);
    });

    const wsServer = new ws.Server({ server: this.httpServer });
    wsServer.on('connection', (connection, req) => {
      const transport = new WsTransport(this, req, connection);

      connection.on('message', async (data) => {
        this.rpc(transport, data);
      });
    });

    this.httpServer.listen(port);
  }

  rpc(transport, data) {
    const packet = jsonParse(data);
    if (!packet) {
      transport.error(500, { error: new Error('JSON parsing error') });
      return;
    }
    const { id, type, args } = packet;
    if (
      type !== 'call' ||
      !id ||
      typeof packet.method !== 'string' ||
      packet.method.trim().length === 0 ||
      !args
    ) {
      transport.error(400, { id, error: new Error('Packet structure error') });
      return;
    }
    const [unit, method] = packet.method.split('/');
    const handler = this.routing.get(`${unit}.${method}`);
    if (!handler) {
      transport.error(404, { id });
      return;
    }
    this.console.log(`${transport.ip}\t${packet.method}`);

    // TODO: Pass context of the request as the argument to the first handler call
    handler()
      .method(args)
      .then((result) => {
        // API handler may return error instead of throwing it so the check is needed
        if (result?.constructor?.name === 'Error') {
          const { code, httpCode = 200 } = result;
          transport.error(code, { id, error: result, httpCode });
          return;
        }
        transport.send({ type: 'callback', id, result });
      })
      .catch((error) => {
        transport.error(error.code, { id, error });
      });
  }
}

module.exports = { Server };
