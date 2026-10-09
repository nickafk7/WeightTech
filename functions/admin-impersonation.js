import admin from 'firebase-admin';
import functions from 'firebase-functions';

const auth = admin.auth();
const db = admin.firestore();

// Cloud Function: Criar token de impersonação
export const createImpersonationToken = functions.https.onRequest(
  async (req, res) => {
    try {
      // Verifica autenticação
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Valida token
      const decodedToken = await auth.verifyIdToken(token);
      const adminUid = decodedToken.uid;

      // Verifica se é admin
      const adminUser = await auth.getUser(adminUid);
      if (adminUser.customClaims?.admin !== true) {
        return res.status(403).json({ error: 'Apenas admins podem fazer isso' });
      }

      // Pega o UID do usuário a ser acessado
      const { targetUid } = req.body;
      if (!targetUid) {
        return res.status(400).json({ error: 'targetUid é obrigatório' });
      }

      // Verifica se o usuário alvo existe
      await auth.getUser(targetUid);

      // Gera um token especial com marcação de impersonação
      const customToken = await auth.createCustomToken(targetUid, {
        impersonatedBy: adminUid,
        impersonatedAt: new Date().toISOString(),
        isImpersonation: true
      });

      // Registra a ação no Firestore (auditoria)
      await db.collection('admin_logs').add({
        adminUid,
        targetUid,
        action: 'impersonation',
        timestamp: new Date(),
        ip: req.ip
      });

      res.json({ token: customToken });
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Cloud Function: Sair da impersonação
export const stopImpersonation = functions.https.onRequest(
  async (req, res) => {
    try {
      sessionStorage.removeItem('impersonationToken');
      sessionStorage.removeItem('impersonatingUser');

      res.json({ success: true, message: 'Saiu da impersonação' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
