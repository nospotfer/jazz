# Supabase Security Advisor Fix (RLS + Function + Auth)

Este guia aplica as correções dos alertas vistos no Security Advisor sem alterar o código da aplicação.

## Escopo coberto

- `RLS Disabled in Public` para tabelas do domínio e mensagens.
- `Function Search Path Mutable` para `public.update_updated_at_column`.
- Preparação para `Leaked Password Protection Disabled` (feito no Dashboard).

## 1) Aplicar SQL de hardening

1. Abra Supabase Dashboard → SQL Editor.
2. Crie uma nova query.
3. Copie e execute todo o conteúdo de [supabase-security-hardening.sql](supabase-security-hardening.sql).
4. Em seguida, execute o conteúdo de [supabase/migrations/202603200001_rls_quiz_voucher_and_system.sql](supabase/migrations/202603200001_rls_quiz_voucher_and_system.sql).

Os scripts são idempotentes (podem executar mais de uma vez).

## 2) Habilitar proteção de senha vazada (Dashboard)

1. Abra Supabase Dashboard → Authentication → Providers/Settings (Security).
2. Ative **Leaked Password Protection**.
3. Salve as alterações.

## 3) Validar no banco

Execute no SQL Editor:

```sql
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'User',
    'EmailVerification',
    'Course',
    'Chapter',
    'Lesson',
    'Attachment',
    'CourseTranslation',
    'ChapterTranslation',
    'LessonTranslation',
    'Purchase',
    'UserProgress',
    'LessonPurchase',
    'LessonNote',
    'VoucherCode',
    'VoucherBatch',
    'VoucherRedemption',
    'DiscountApplied',
    'LessonQuizQuestion',
    'LessonQuizOption',
    'LessonQuizAttempt',
    'LessonQuizAttemptAnswer',
    'LessonQuizSummary',
    'messagethread',
    'message',
    '_prisma_migrations'
  )
ORDER BY c.relname;
```

E para função:

```sql
SELECT
  n.nspname AS schema_name,
  p.proname,
  p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'update_updated_at_column';
```

Esperado: `proconfig` contém `search_path=public, pg_catalog`.

## 4) Validar no app (smoke test)

- Login/cadastro.
- Compra e acesso ao curso comprado.
- Notas da aula.
- Mensagens aluno/professor.
- Área admin.

## 5) Revalidar Security Advisor

- Abra Security Advisor e clique em `Refresh`.
- Os erros de `RLS Disabled in Public` e `Function Search Path Mutable` devem desaparecer.
- `Leaked Password Protection Disabled` deve desaparecer após ativação no Authentication.

## Regras aplicadas nesta fase

- Curso/Capítulo/Lição/Anexo: leitura para quem comprou o curso (ou admin).
- Purchase/UserProgress/LessonPurchase: acesso ao próprio usuário (ou admin).
- LessonNote: dono da nota (ou admin).
- VoucherCode: leitura por usuário autenticado (somente vouchers ativos e não expirados) ou admin; escrita admin.
- VoucherBatch: admin only.
- VoucherRedemption: próprio usuário ou admin.
- DiscountApplied: próprio usuário (via Purchase) ou admin.
- LessonQuizQuestion/LessonQuizOption: acesso para usuário com curso adquirido (ou admin).
- LessonQuizAttempt/LessonQuizAttemptAnswer/LessonQuizSummary: próprio usuário (ou admin).
- MessageThread/Message: participante da conversa (ou admin).
- _prisma_migrations: admin only.

## Observação importante

Neste projeto, o `DATABASE_URL` de produção usa `postgres` (bypass de RLS), então o Prisma continua funcionando. As policies protegem principalmente exposição via APIs/PostgREST do Supabase.
