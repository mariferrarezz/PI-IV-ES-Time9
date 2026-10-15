import { app } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function main() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`API rodando em http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Falha ao iniciar o servidor:", err);
  process.exit(1);
});
