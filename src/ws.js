'use strict';

const { Server } = require('ws');

module.exports = (routing, server, console) => {
  const ws = new Server({ server });

  ws.on('connection', (connection, req) => {
    const ip = req.socket.remoteAddress;
    connection.on('message', async (message) => {
      const obj = JSON.parse(message);
      const { name, method, args = [] } = obj;
      const handler = routing.get(`${name}.${method}`);
      if (!handler) return connection.send('"Not found"', { binary: false });
      const json = JSON.stringify(args);
      const parameters = json.substring(1, json.length - 1);
      console.log(`${ip} ${name}.${method}(${parameters})`);
      try {
        // TODO: Pass context of the request as the argument to the first handler call
        const result = await handler().method(...args);
        connection.send(JSON.stringify(result), { binary: false });
      } catch (err) {
        console.error(err);
        connection.send('"Server error"', { binary: false });
      }
    });
  });

  console.log(`API on port ${server.address().port}`);
};
