declare global {
  namespace Express {
    interface Request {
      /** Set by the JWT auth middleware after a token is verified. */
      userId?: string;
    }
  }
}

export {};
