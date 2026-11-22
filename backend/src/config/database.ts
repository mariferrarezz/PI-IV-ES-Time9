import mongoose from "mongoose";
import { env } from "./env";
import { DatabaseUnavailableError } from "../shared/errors";

// Nunca permitir que o ODM reconfigure o banco compartilhado ou enfileire operações offline.
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);
mongoose.set("bufferCommands", false);
mongoose.set("debug", false);

let conexaoPendente: Promise<void> | undefined;
export const databaseReady = () => mongoose.connection.readyState === 1 && mongoose.connection.name === env.databaseName;

mongoose.connection.on("error", () => console.error(JSON.stringify({ codigo: "BANCO_ERRO_CONEXAO" })));

export async function connectDatabase(): Promise<void> {
  if (databaseReady()) return;
  if (!conexaoPendente) {
    conexaoPendente = mongoose.connect(env.mongodbUri, {
      dbName: env.databaseName, autoIndex: false, autoCreate: false,
      serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, socketTimeoutMS: 10000,
    }).then(() => undefined).catch(() => { throw new DatabaseUnavailableError(); })
      .finally(() => { conexaoPendente = undefined; });
  }
  await conexaoPendente;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
