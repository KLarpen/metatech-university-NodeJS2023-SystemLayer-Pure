import { IncomingMessage } from 'node:http';

declare namespace common {
  function hashPassword(password: string): Promise<string>;
  function validatePassword(
    password: string,
    serHash: string,
  ): Promise<boolean>;
  function jsonParse(buffer: Buffer | string): object | null;
  function receiveBody(req: IncomingMessage): Promise<string>;
}
