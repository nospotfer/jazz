# Configuração do Ambiente de Desenvolvimento Local

## ✅ Configurado com Sucesso

Este projeto foi configurado e vinculado ao GitHub. Você pode começar a trabalhar localmente!

### 🔗 Conexão com GitHub

- **Repositório:** https://github.com/nospotfer/jazz
- **Branch:** master
- **Status:** Sincronizado

### 📁 Estrutura do Projeto

```
/home/igor/Desktop/jazz-Repage-Jazz/
├── .git/                           # Repositório Git principal
├── .gitignore                      # Arquivos ignorados pelo Git
└── jazz-Repage-Jazz/
    └── jazz-lms/                   # Projeto Next.js Jazz LMS
        ├── .vscode/                # Configurações do VS Code
        ├── src/                    # Código-fonte
        ├── prisma/                 # Schema do banco de dados
        ├── public/                 # Arquivos públicos
        └── ...
```

### 🛠️ Próximos Passos para Desenvolvimento

#### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais:

```bash
cd /home/igor/Desktop/jazz-Repage-Jazz/jazz-Repage-Jazz/jazz-lms
code .env
```

Você precisa configurar:
- **Supabase**: URL e chave anônima
- **Database URL**: String de conexão com Prisma
- **Stripe**: Chaves de teste/produção

Veja o arquivo `.env.example` para referência.

#### 2. Configurar o Banco de Dados

```bash
# Gerar o Prisma Client (já foi executado)
npx prisma generate

# Executar migrações (se necessário)
npx prisma migrate dev

# Popular o banco com dados de exemplo
npm run seed:sample
```

#### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em: http://localhost:3000

#### 4. Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Inicia o servidor de desenvolvimento

# Build
npm run build        # Cria build de produção
npm start            # Inicia o servidor de produção

# Database
npm run seed         # Popula banco com dados padrão
npm run seed:sample  # Popula banco com dados de exemplo

# Linting
npm run lint         # Executa o linter
```

### 🔧 Configurações do VS Code

As seguintes configurações foram adicionadas automaticamente:

- **Formatação automática** ao salvar
- **ESLint** integrado
- **Prettier** como formatador padrão
- **Suporte ao TypeScript** aprimorado
- **Debugger** configurado para Next.js

#### Extensões Recomendadas

O VS Code já sugerirá as extensões recomendadas. Instale-as para melhor experiência:

1. Prettier - Code formatter
2. ESLint
3. Prisma
4. Tailwind CSS IntelliSense
5. GitHub Copilot
6. GitLens

### 🐛 Debug no VS Code

Use F5 ou vá em "Run and Debug" no VS Code e selecione:

- **Next.js: debug server-side** - Debug do lado do servidor
- **Next.js: debug client-side** - Debug do lado do cliente (abre Chrome)
- **Next.js: debug full stack** - Debug completo

### 📝 Git Workflow

```bash
# Ver status
git status

# Adicionar arquivos
git add .

# Fazer commit
git commit -m "Sua mensagem"

# Enviar para GitHub
git push

# Puxar atualizações
git pull
```

### ⚠️ Avisos Importantes

1. **Nunca commite o arquivo `.env`** - Ele contém informações sensíveis
2. **Instale as extensões recomendadas** para melhor experiência
3. **Configure suas credenciais** do Supabase e Stripe antes de rodar
4. **Verifique as vulnerabilidades** com `npm audit` e corrija se necessário

### 📚 Documentação Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

Veja também os documentos na pasta `/docs` para mais informações sobre o projeto.

---

**Status**: ✅ Pronto para desenvolvimento
**Última atualização**: 10 de Fevereiro de 2026
