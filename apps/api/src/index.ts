import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { buildAuthRouter } from "./auth/composition.js";
import { buildVaultRouter } from "./vault/composition.js";

// Production runs via tsx (`npm start`) so the `.ts` source of
// @zerovault/shared-types resolves at runtime.
// Composition (env + Prisma) only runs for the entrypoint, never on import in tests.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

export const app = isMain
  ? createApp({
      routes: [
        ["/auth", buildAuthRouter()],
        ["/vault", buildVaultRouter()],
      ],
    })
  : createApp();

if (isMain) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`API listening on :${port}`);
  });
}
