type QueryResult = Promise<object[]>;

function deleteRecord(id: number | string): QueryResult;

declare namespace db {
  export function query(sql: string, args: any[]): QueryResult;
  export function read(id: number | string, fields: string[]): QueryResult;
  export function create(record: object): QueryResult;
  export function update(id: number | string, record: object): QueryResult;
  export { deleteRecord as delete };
}
