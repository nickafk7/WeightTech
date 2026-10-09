# 🔐 Setup Firebase Admin - Passo a Passo

## 1️⃣ Obter as Credenciais do Firebase

### No Firebase Console:

1. Va para **Project Settings** ⚙️
2. Clique na aba **Service Accounts**
3. Clique em **Generate New Private Key**
4. Um arquivo `serviceAccountKey.json` será baixado

⚠️ **NUNCA compartilhe este arquivo!** Mantenha seguro.

## 2️⃣ Colocar no Projeto

```bash
# Copie o arquivo para a pasta backend/
cp ~/Downloads/serviceAccountKey.json backend/serviceAccountKey.json
```

### ⚠️ IMPORTANTE - Git Ignore:

O arquivo já está no `.gitignore`, mas NUNCA faça:
```bash
git add serviceAccountKey.json  # ❌ NUNCA!
```

## 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp backend/.env.example backend/.env.local

# Edite backend/.env.local com seus valores:
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
```

## 4️⃣ Instalar Dependências

```bash
npm install firebase-admin
```

## 5️⃣ Usar o Admin

### Exemplo 1: Promover Usuário a Admin

```bash
cd backend
node promote-admin.js
```

Isso vai:
- ✅ Adicionar custom claims `admin: true`
- ✅ Salvar no Firestore
- ✅ Registrar a ação

### Exemplo 2: Usar em um Script

```javascript
import { auth, db } from './firebase-admin-config.js';

// Listar todos os usuários
const users = await auth.listUsers();
users.users.forEach(user => {
  console.log(`- ${user.email} (UID: ${user.uid})`);
});
```

## 🔑 Estrutura de Pastas

```
backend/
├── serviceAccountKey.json      ← Suas credenciais (não commitar!)
├── .env.local                  ← Suas variáveis (não commitar!)
├── .env.example                ← Exemplo para outros
├── firebase-admin-config.js    ← Config centralizada
├── promote-admin.js            ← Script para promover admin
├── SETUP.md                    ← Este arquivo
└── outras-scripts.js           ← Seus scripts
```

## 🚀 Próximos Passos

1. Setup Cloud Functions (Firebase deploy)
2. Configurar Firestore Rules
3. Testar o fluxo de admin no app

## ❓ Erros Comuns

### "serviceAccountKey.json not found"
→ Certifique-se que o arquivo está em `backend/serviceAccountKey.json`

### "Firebase not initialized"
→ Verifique se `firebase-admin-config.js` está sendo importado corretamente

### "Permission denied"
→ Verifique as Firestore Rules e Custom Claims no Firebase Console

---

**Precisa de ajuda? Chama!** 🔥
