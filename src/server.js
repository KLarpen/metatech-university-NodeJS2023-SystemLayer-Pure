'use strict';

const http = require('node:http');
const path = require('node:path');
const fsp = require('node:fs').promises;
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const ws = require('ws');
const { receiveBody, jsonParse } = require('../lib/common.js');
const {
  HttpTransport,
  WsTransport,
  MIME_TYPES,
  HEADERS,
} = require('./transport.js');

const sessions = new Map(); // <token, Session>

class Session {
  constructor(token, data) {
    this.token = token;
    this.state = { ...data };
  }
}

class Context {
  constructor(client) {
    this.client = client;
    this.uuid = crypto.randomUUID();
    this.state = {};
    this.session = client?.session || null;
  }
}

class Client extends EventEmitter {
  #transport;

  constructor(transport) {
    super();
    this.#transport = transport;
    this.ip = transport.ip;
    this.session = null;
  }

  error(code, options) {
    this.#transport.error(code, options);
  }

  send(obj, code) {
    this.#transport.send(obj, code);
  }

  emit(name, data) {
    if (name === 'close') {
      super.emit(name, data);
      return;
    }
    this.send({ type: 'event', name, data });
  }

  createContext() {
    return new Context(this);
  }

  initializeSession(token, data = {}) {
    this.finalizeSession();
    this.session = new Session(token, data);
    sessions.set(token, this.session);
    return true;
  }

  finalizeSession() {
    if (!this.session) return false;
    sessions.delete(this.session.token);
    this.session = null;
    return true;
  }

  restoreSession(token) {
    const session = sessions.get(token);
    if (!session) return false;
    this.session = session;
    return true;
  }

  destroy() {
    this.emit('close');
    if (!this.session) return;
    this.finalizeSession();
  }
}

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
      const client = new Client(transport);
      const data = await receiveBody(req);
      this.rpc(client, data);

      req.on('close', () => {
        client.destroy();
      });
    });

    const wsServer = new ws.Server({ server: this.httpServer });
    wsServer.on('connection', (connection, req) => {
      const transport = new WsTransport(this, req, connection);
      const client = new Client(transport);

      connection.on('message', async (data) => {
        this.rpc(client, data);
      });

      connection.on('close', () => {
        client.destroy();
      });
    });

    this.httpServer.listen(port);
  }

  rpc(client, data) {
    const packet = jsonParse(data);
    if (!packet) {
      client.error(500, { error: new Error('JSON parsing error') });
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
      client.error(400, { id, error: new Error('Packet structure error') });
      return;
    }
    const [unit, method] = packet.method.split('/');
    const handler = this.routing.get(`${unit}.${method}`);
    if (!handler) {
      client.error(404, { id });
      return;
    }

    const context = client.createContext();
    this.console.log(`${client.ip}\t${packet.method}`);
    handler(context)
      .method(args)
      .then((result) => {
        // API handler may return error instead of throwing it so the check is needed
        if (result?.constructor?.name === 'Error') {
          const { code, httpCode = 200 } = result;
          client.error(code, { id, error: result, httpCode });
          return;
        }
        client.send({ type: 'callback', id, result });
      })
      .catch((error) => {
        client.error(error.code, { id, error });
      });
  }
}

module.exports = { Server };
