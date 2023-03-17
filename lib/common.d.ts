declare namespace common {
  function hashPassword(password: string): Promise<string>;
  function validatePassword(password: string, serHash: string): Promise<boolean>;
}

// declare function _exports(config: any): {
//   hashPassword: (password: string) => Promise<string>;
//   validatePassword: (password: string, serHash: string) => Promise<boolean>;
// };
// export = _exports;
