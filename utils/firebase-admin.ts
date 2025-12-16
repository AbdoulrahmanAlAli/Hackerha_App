import * as admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com",
} as admin.ServiceAccount;

if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("FIREBASE_PRIVATE_KEY is missing");
}

if (!serviceAccount.privateKey) {
  console.error("FIREBASE_PRIVATE_KEY is missing or invalid");

  // محاولة قراءة من ملف
  try {
    const fs = require("fs");
    if (fs.existsSync(serviceAccount)) {
      const fileContent = JSON.parse(fs.readFileSync(serviceAccount, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(fileContent),
      });
      console.log("Firebase Admin initialized from file");
    } else {
      throw new Error("No Firebase credentials found");
    }
  } catch (fileError) {
    console.error("Failed to load Firebase credentials from file:", fileError);
    throw new Error("Firebase Admin SDK initialization failed");
  }
} else {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export { admin };
