import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env";

// Se FIREBASE_AUTH_EMULATOR_HOST estiver definida (ex.: localhost:9099),
// o firebase-admin valida os tokens contra o emulador automaticamente.
const app = initializeApp({ projectId: env.firebaseProjectId });

export const firebaseAuth = getAuth(app);
