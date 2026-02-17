# 🚀 Guia Rápido de Configuração da Área Admin

## Passos para ativar a área administrativa

### 1️⃣ Aplicar Migrações do Banco de Dados

```bash
cd jazz-lms
npx prisma migrate dev --name add_user_table
npx prisma generate
```

### 2️⃣ Configurar Seu Email como Admin

Edite o arquivo `scripts/create-admin.ts` e substitua o email padrão pelo seu:

```typescript
const adminEmail = 'SEU-EMAIL@EXEMPLO.COM';  // ← Altere aqui!
```

Ou defina como variável de ambiente:

```bash
export ADMIN_EMAIL="seu-email@exemplo.com"
```

### 3️⃣ Criar o Usuário Admin

```bash
npm run admin:create
```

### 4️⃣ Fazer Login

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/auth`
3. Faça login com o email que você configurou como admin
4. Acesse: `http://localhost:3000/admin`

## ✅ Pronto!

Você agora tem acesso à área administrativa completa com:

- 📊 Dashboard com estatísticas
- 📚 Gerenciamento de cursos
- 👥 Gerenciamento de usuários
- 📈 Relatórios detalhados

## 🔧 Comandos Úteis

```bash
# Abrir Prisma Studio (interface visual do banco)
npm run admin:studio

# Criar novo admin
npm run admin:create

# Ver logs do servidor
npm run dev
```

## 📖 Documentação Completa

Consulte [ADMIN_SETUP.md](./ADMIN_SETUP.md) para documentação detalhada.

## ⚠️ IMPORTANTE

O email configurado como ADMIN deve ser **exatamente o mesmo** que você usa para fazer login no Supabase!

---

**Desenvolvido para Jazz LMS** 🎵
