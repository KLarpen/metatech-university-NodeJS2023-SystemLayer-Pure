import pgModule from 'pg';
import type { Pool } from 'pg';

type QueryResult = Promise<object[]>;

interface CrudRepository {
  query(sql: string, args: any[]): QueryResult;
  read(id: number | string, fields: string[]): QueryResult;
  create(record: object): QueryResult;
  update(id: number | string, record: object): QueryResult;
  delete(id: number | string): QueryResult;
}

declare namespace db {
  export const pg: typeof pgModule;
  export const pgPool: Pool;
  export function crud(pgPool: Pool): (table: string) => CrudRepository;
}
