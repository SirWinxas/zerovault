export interface Hasher {
  hash(value: string): Promise<string>;
  verify(value: string, stored: string): Promise<boolean>;
}
