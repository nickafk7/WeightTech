import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://seu-projeto.firebaseio.com' // Mude para sua URL
});

const auth = admin.auth();
const db = admin.firestore();

// Função para promover a admin
async function promoteToAdmin(uid) {
  try {
    // 1. Set custom claims
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(`✅ ${uid} promovido a admin`);

    // 2. Salva no Firestore também (pra referência)
    await db.collection('users').doc(uid).update({
      isAdmin: true,
      adminSince: new Date(),
      permissions: ['viewAllUsers', 'accessAsUser']
    });
    console.log(`✅ Dados de admin salvos no Firestore`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executa
const uid = 'xrs6K9zP4pOvizaGf4JEq4Grr433';
promoteToAdmin(uid);
