import dotenv from "dotenv";
import path from "node:path";

// Funciona tanto em src/config quanto em dist/config, sem depender do diretório do terminal.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT_INVALIDA");

export const env = {
  port,
  databaseName: "sentinela",
  mongodbUri: required("MONGODB_URI"),
  firebaseProjectId: required("FIREBASE_PROJECT_ID"),
  authEmulator: Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST),
};
