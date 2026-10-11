import jwt from "jsonwebtoken";
import { MIN_SECRET_LENGTH, requireSecret } from "../../config/require-secret.js";
import type { TokenService } from "../ports/token-service.js";

export interface JwtTokenServiceOptions {
  secret: string;
  expiresIn?: string;
}

const ALGORITHM = "HS256";

export class JwtTokenService implements TokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor({ secret, expiresIn = "1h" }: JwtTokenServiceOptions) {
    this.secret = requireSecret("JWT_SECRET", secret, MIN_SECRET_LENGTH);
    this.expiresIn = expiresIn;
  }

  async sign(payload: { sub: string }): Promise<string> {
    return jwt.sign({ sub: payload.sub }, this.secret, {
      algorithm: ALGORITHM,
      expiresIn: this.expiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  async verify(token: string): Promise<{ sub: string }> {
    // Pin the algorithm to prevent alg-confusion / "none" downgrade.
    const decoded = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });
    if (typeof decoded === "string" || typeof decoded.sub !== "string") {
      throw new Error("Invalid token payload");
    }
    return { sub: decoded.sub };
  }
}
