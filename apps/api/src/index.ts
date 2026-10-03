import { fileURLToPath } from "node:url";
import { app } from "./app.js";

export { app };

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`API listening on :${port}`);
  });
}
