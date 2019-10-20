import * as admin from "firebase-admin";
import serviceAccount from "../../keys/privatekey.json";

// Admin SDK initialization
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// Firestore Database initialization
const db = admin.firestore();

export default db;