import * as admin from "firebase-admin";
import { env } from "../../bootstrap/env";
import { logger } from "../../bootstrap/logger";

const privateKey = env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");

const serviceAccount = {
  type: "service_account",
  project_id: env.FIREBASE_PROJECT_ID!,
  private_key_id: env.FIREBASE_PRIVATE_KEY_ID!,
  private_key: privateKey,
  client_email: env.FIREBASE_CLIENT_EMAIL!,
  client_id: env.FIREBASE_CLIENT_ID!,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: env.FIREBASE_CLIENT_CERT_URL!,
  universe_domain: "googleapis.com",
} as admin.ServiceAccount;

try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    logger.success("Firebase initialized");
  }
} catch (error) {
  logger.error("Failed to initialize Firebase Admin:", error);
  throw error;
}

export { admin };
