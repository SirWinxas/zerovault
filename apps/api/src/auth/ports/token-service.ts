export interface TokenService {
  sign(payload: { sub: string }): Promise<string>;
  verify(token: string): Promise<{ sub: string }>;
}
