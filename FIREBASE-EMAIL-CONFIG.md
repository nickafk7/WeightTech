# Configuração de Email de Redefinição de Senha - Firebase

## 📧 Como usar o template de email

### 1. No Firebase Console:

1. Vá para **Project Settings** ⚙️
2. Clique na aba **Email Templates**
3. Procure por **Password reset** 
4. Clique em **Edit template**

### 2. Configure o Email:

**Subject (Assunto):**
```
🔥 Chama - Redefinir sua senha
```

**Custom Email (HTML):**
Copie todo o conteúdo do arquivo `email-reset-password.html`

**Plain text (alternativa):**
Copie todo o conteúdo do arquivo `email-reset-password-plaintext.txt`

### 3. Variáveis disponíveis:

- `%APP_NAME%` → Nome do seu app (ex: "Chama")
- `%EMAIL%` → Email da pessoa
- `%LINK%` → Link para redefinir a senha (gerado automaticamente)

### 4. Teste:

1. Salve o template
2. Vá para **Authentication** > **Users**
3. Clique em um usuário
4. Clique nos 3 pontinhos > **Delete user**
5. Crie o usuário novamente e teste o fluxo de "Esqueci a senha"

## 🎨 Customização

Você pode editar:
- **Cores**: Troque `#FF6B35` por sua cor
- **Texto**: Adapte as mensagens conforme necessário
- **Logo**: Mude o emoji 🔥 ou adicione uma imagem

### Exemplo com logo:

```html
<img src="https://seu-site.com/logo.png" alt="Chama" style="max-width: 150px;">
```

## ⚠️ Importante

- Firebase só suporta variáveis: `%APP_NAME%`, `%EMAIL%`, `%LINK%`
- O link expira automaticamente (padrão: 1 hora)
- Sempre teste antes de colocar em produção

## 🔧 No código (JavaScript):

```javascript
import { sendPasswordResetEmail } from 'firebase/auth';

// Quando usuário clica em "Esqueci a senha"
sendPasswordResetEmail(auth, email)
  .then(() => {
    alert('Email enviado! Verifique sua caixa de entrada.');
  })
  .catch((error) => {
    console.error('Erro:', error);
  });
```

---

**Qualquer dúvida, é só chamar!** 🚀
