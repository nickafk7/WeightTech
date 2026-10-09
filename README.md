# 🔥 Chama - Sistema de Disciplina

App de disciplina com streaks, tarefas diárias e painel de administrador.

## 📁 Estrutura do Projeto

```
/
├── public/                    # Frontend (servido no GitHub Pages)
│   ├── index.html            # Página principal
│   ├── manifest.json         # Configuração PWA
│   ├── sw.js                 # Service Worker
│   ├── admin-panel.js        # Painel de admin
│   └── /icons/               # Ícones da PWA
│       ├── icon-192x192.png
│       └── icon-512x512.png
│
├── functions/                # Cloud Functions (Firebase)
│   └── admin-impersonation.js
│
├── backend/                  # Scripts de backend
│   └── promote-admin.js
│
├── .gitignore
└── README.md
```

## 🚀 Deploy

### 1. Frontend (GitHub Pages)

```bash
# Se ainda não tem repo
git init
git add .
git commit -m "feat: Chama PWA + Sistema de Admin"
git branch -M main
git remote add origin https://github.com/seu-usuario/chama.git
git push -u origin main
```

Depois ative GitHub Pages:
- Settings > Pages > Source: `main` branch, `/root` folder

### 2. Promover Admin

Antes: Configure o Firebase (`backend/promote-admin.js`)

```javascript
// Edite essas linhas:
// 1. Importe seu serviceAccountKey.json
// 2. Mude a databaseURL para sua URL do Firebase
```

Execute:
```bash
cd backend
node promote-admin.js
```

Isso promove `xrs6K9zP4pOvizaGf4JEq4Grr433` a admin.

### 3. Cloud Functions

Deploy da função de impersonation:

```bash
# Instale Firebase CLI
npm install -g firebase-tools
firebase login
firebase deploy --only functions
```

Ou copie o conteúdo de `functions/admin-impersonation.js` direto no Firebase Console.

### 4. Firestore Rules

No Firebase Console > Firestore > Rules, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /users/{userId} {
      allow read, write: if request.auth.token.admin == true;
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    match /admin_logs/{logId} {
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }

    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📱 PWA (Progressive Web App)

O app funciona offline e pode ser instalado na tela inicial:

- ✅ Service Worker para cache
- ✅ Ícones 192x192 e 512x512
- ✅ Suporte offline
- ✅ Tema laranja (#FF6B35)

## 🔑 Painel de Admin

Admins têm acesso a:
- ✅ Ver todos os usuários
- ✅ Botão "Acessar como" (sem pedir senha)
- ✅ Logs de auditoria automáticos
- ✅ Gerenciar permissões

### Como usar:

1. Admin faz login normalmente
2. Clica na aba "Admin" 
3. Vê lista de todos os usuários
4. Clica "Acessar como" em qualquer usuário
5. Conecta automaticamente sem precisar de senha

## 🛠 Variáveis de Ambiente

Crie um arquivo `.env.local` (não commite!):

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
```

## 📝 Próximos Passos

- [ ] Integrar painel de admin no HTML
- [ ] Adicionar animações de tarefas
- [ ] Sistema de notificações
- [ ] Relatórios de progresso

---

**Feito com 🔥 por Claude**
