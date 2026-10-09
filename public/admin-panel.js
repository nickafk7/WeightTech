// admin-panel.js
// Módulo para gerenciar painel de admin no Chama

export class AdminPanel {
  constructor(auth, db) {
    this.auth = auth;
    this.db = db;
  }

  // Verifica se usuário é admin
  async isAdmin(user) {
    const idTokenResult = await user.getIdTokenResult(true);
    return idTokenResult.claims.admin === true;
  }

  // Lista todos os usuários (busca no Firestore)
  async getAllUsers() {
    try {
      const snapshot = await this.db
        .collection('users')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  // Cria um token especial para admin acessar como outro usuário
  async createImpersonationToken(targetUid) {
    try {
      // Chama uma Cloud Function no seu backend
      const response = await fetch('/api/admin/create-impersonation-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({ targetUid })
      });

      const { token } = await response.json();
      return token;
    } catch (error) {
      console.error('Erro ao criar token:', error);
      return null;
    }
  }

  // Conecta automaticamente como outro usuário
  async accessAsUser(targetUid) {
    try {
      const token = await this.createImpersonationToken(targetUid);
      if (!token) throw new Error('Falha ao criar token');

      // Salva o token no sessionStorage (não persiste entre sessões)
      sessionStorage.setItem('impersonationToken', token);
      sessionStorage.setItem('impersonatingUser', targetUid);

      // Recarrega a página com o novo contexto
      window.location.reload();
    } catch (error) {
      console.error('❌ Erro ao acessar como usuário:', error);
      alert('Erro ao acessar conta do usuário');
    }
  }

  // Renderiza o painel de admin
  async renderPanel(container) {
    const users = await this.getAllUsers();

    const html = `
      <div class="admin-panel">
        <h2>🔑 Painel de Admin</h2>
        <p>Total de usuários: <strong>${users.length}</strong></p>

        <div class="users-list">
          ${users.map(user => `
            <div class="user-item">
              <div class="user-info">
                <span class="user-name">${user.name || 'Sem nome'}</span>
                <span class="user-email">${user.email}</span>
                ${user.isAdmin ? '<span class="badge-admin">ADMIN</span>' : ''}
              </div>
              <button
                class="btn-access"
                onclick="window.adminPanel.accessAsUser('${user.uid}')"
              >
                Acessar como
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}

// CSS para o painel
export const adminPanelStyles = `
.admin-panel {
  background: var(--s1, #111);
  border: 1px solid var(--line, #272727);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.admin-panel h2 {
  margin-bottom: 16px;
  font-size: 20px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  background: var(--s2, #181818);
  border: 1px solid var(--line, #272727);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 12px;
  color: var(--mut, #8a8a8a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-admin {
  display: inline-block;
  background: #FF6B35;
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  width: fit-content;
  margin-top: 4px;
}

.btn-access {
  background: #FF6B35;
  color: #000;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.3s;
}

.btn-access:active {
  opacity: 0.8;
}
`;
