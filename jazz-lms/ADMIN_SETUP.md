# 🔐 Área Administrativa - Intranet

Este documento descreve como configurar e usar a área administrativa (Admin Intranet) do Jazz LMS.

## 📋 Visão Geral

A área administrativa é uma seção protegida do site, acessível apenas para desenvolvedores e donos do site com role de **ADMIN**. Ela permite:

- 📊 **Dashboard**: Visão geral de estatísticas e métricas
- 📚 **Gerenciamento de Cursos**: Visualizar e editar todos os cursos
- 👥 **Gerenciamento de Usuários**: Ver todos os usuários e suas permissões
- 📈 **Estatísticas Detalhadas**: Relatórios de vendas, receita e engajamento

## 🚀 Configuração Inicial

### 1. Migrar o Banco de Dados

Primeiro, você precisa aplicar as migrações para criar a tabela de usuários:

```bash
cd jazz-lms
npx prisma migrate dev --name add_user_table
npx prisma generate
```

### 2. Criar Seu Primeiro Usuário Admin

Execute o script de criação de admin (será necessário configurar o email):

```bash
# Configure o email do admin (use o mesmo email que você usa no Supabase)
export ADMIN_EMAIL="seu-email@exemplo.com"

# Execute o script
npx tsx scripts/create-admin.ts
```

**Alternativa: Usando Prisma Studio**

```bash
npx prisma studio
```

Depois:
1. Abra a tabela `User`
2. Clique em "Add record"
3. Preencha:
   - `id`: pode ser qualquer string única (ex: "admin-1")
   - `email`: seu email usado no Supabase
   - `role`: ADMIN
4. Clique em "Save"

### 3. Verificar Configuração

Depois de criar o usuário admin:

1. Faça logout do site (se estiver logado)
2. Faça login novamente com o email que você configurou como ADMIN
3. Acesse: `http://localhost:3000/admin`

Se tudo estiver correto, você verá o Dashboard Administrativo! 🎉

## 🔒 Sistema de Permissões

### Roles Disponíveis

- **USER**: Usuário comum (pode comprar e acessar cursos)
- **ADMIN**: Administrador (acesso total à área administrativa)

### Proteção de Rotas

A área `/admin` é protegida automaticamente:
- Usuários não autenticados são redirecionados para `/dashboard`
- Usuários com role `USER` não podem acessar
- Apenas usuários com role `ADMIN` têm acesso

## 📱 Páginas Disponíveis

### Dashboard Principal
**Rota**: `/admin`

Mostra:
- Total de cursos, usuários e vendas
- Compras recentes
- Ações rápidas

### Gerenciamento de Cursos
**Rota**: `/admin/courses`

- Lista todos os cursos
- Status de publicação
- Número de alunos e lições
- Links para edição

### Gerenciamento de Usuários
**Rota**: `/admin/users`

- Lista todos os usuários
- Mostra roles (ADMIN ou USER)
- Número de cursos por usuário
- Data de cadastro

### Estatísticas
**Rota**: `/admin/stats`

- KPIs principais (receita, vendas, conclusão)
- Top 5 cursos mais vendidos
- Vendas por mês
- Resumos detalhados

## 👤 Como Promover Usuários a Admin

### Método 1: Prisma Studio (Recomendado)

```bash
npx prisma studio
```

1. Navegue até a tabela `User`
2. Encontre o usuário desejado
3. Edite o campo `role` para `ADMIN`
4. Salve

### Método 2: Script TypeScript

Crie um arquivo `scripts/promote-user.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteUser(email: string) {
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });
  console.log(`✅ ${email} promovido a ADMIN`);
}

promoteUser('email@exemplo.com')
  .finally(() => prisma.$disconnect());
```

Execute: `npx tsx scripts/promote-user.ts`

### Método 3: SQL Direto

```sql
UPDATE User SET role = 'ADMIN' WHERE email = 'email@exemplo.com';
```

## 🔧 Sincronização Automática de Usuários

Quando um usuário faz login pela primeira vez via Supabase, ele é automaticamente:
1. Criado na tabela `User` do Prisma
2. Atribuído com role `USER` por padrão
3. Sincronizado com seu ID do Supabase

Isso acontece no callback de autenticação em `/src/app/auth/callback/route.ts`.

## 🎨 Personalização

### Cores e Tema

O admin usa um tema escuro com destaque em amarelo (`yellow-500`). Para personalizar:

1. Edite os componentes em `/src/app/admin/`
2. Modifique as classes Tailwind
3. Cores principais:
   - Background: `gray-950`, `gray-900`, `gray-800`
   - Destaque: `yellow-500`, `yellow-400`
   - Sucesso: `green-400`, `green-500`
   - Informação: `blue-400`, `purple-400`

### Adicionar Novas Páginas

1. Crie um arquivo em `/src/app/admin/sua-pagina/page.tsx`
2. A proteção é automática (via layout)
3. Adicione link no menu (em `/src/app/admin/layout.tsx`)

## 🛡️ Segurança

### Boas Práticas

1. **Nunca exponha credenciais de admin publicamente**
2. **Use emails profissionais** para contas admin
3. **Limite o número de admins** ao mínimo necessário
4. **Revise regularmente** a lista de usuários admin
5. **Monitore atividades** através das estatísticas

### Verificação de Acesso

O helper `/src/lib/admin.ts` fornece:

- `isAdmin()`: Verifica se o usuário atual é admin
- `requireAdmin()`: Força redirect se não for admin
- `getCurrentUser()`: Retorna os dados do usuário atual

## 📝 Troubleshooting

### "Acesso negado" ao entrar em /admin

**Causa**: Seu usuário não tem role ADMIN

**Solução**:
1. Verifique se você criou o usuário admin: `npx prisma studio`
2. Confirme que o email está correto (mesmo do Supabase)
3. Verifique se o campo `role` está como `ADMIN`

### Usuário não aparece na lista

**Causa**: Usuário não foi sincronizado com o banco

**Solução**:
1. Faça logout e login novamente
2. Ou execute manualmente: importe `syncUserWithDatabase()` e execute

### Erro "User table not found"

**Causa**: Migração não foi aplicada

**Solução**:
```bash
npx prisma migrate dev
npx prisma generate
```

## 🚀 Próximos Passos

Funcionalidades futuras que podem ser adicionadas:

- [ ] Logs de atividades admin
- [ ] Editor de cursos inline
- [ ] Upload de imagens e vídeos
- [ ] Sistema de notificações
- [ ] Exportação de relatórios (CSV, PDF)
- [ ] Painel de suporte ao usuário
- [ ] Gerenciamento de cupons e promoções
- [ ] Analytics avançados com gráficos

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do console do navegador
2. Logs do terminal do servidor Next.js
3. Prisma Studio para verificar dados
4. Supabase Dashboard para auth

---

**Desenvolvido para Jazz LMS** 🎵
Acesso restrito a administradores autorizados.
