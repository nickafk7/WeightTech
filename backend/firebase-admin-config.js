import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega o arquivo de credenciais
// ⚠️ NUNCA coloque isso no GitHub! Use .env ao invés
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '../serviceAccountKey.json');

let serviceAccount;

try {
  const rawData = fs.readFileSync(serviceAccountPath);
  serviceAccount = JSON.parse(rawData);
} catch (error) {
  console.error('❌ Erro ao carregar serviceAccountKey.json');
  console.error('   Certifique-se de que o arquivo existe em:', serviceAccountPath);
  process.exit(1);
}

// Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://seu-projeto.firebaseio.com'
});

// Exporta os serviços
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

console.log('✅ Firebase Admin inicializado com sucesso!');

export default admin;
