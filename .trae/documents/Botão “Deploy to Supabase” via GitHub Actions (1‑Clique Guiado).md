## Objetivo
- Criar um botão estilo Vercel que, ao clicar, leve o cliente para executar um workflow do GitHub Actions que replica código, banco e Edge Functions para o projeto Supabase dele.

## Abordagem
- GitHub não suporta executar Actions sem login nem coletar segredos via botão. Então faremos um botão que leva à página do workflow (“Run workflow”) e um guia com passos mínimos:
  1) Cliente adiciona secrets do Supabase (uma vez)
  2) Clica em “Run workflow” (workflow_dispatch)
  3) Workflow executa: db pull do fonte → db push no alvo → set secrets → deploy de todas Edge Functions

## Implementações
1) Workflow com inputs opcionais
- Atualizar `supabase-replicate.yml` para aceitar `inputs` (ex.: SOURCE_REF, TARGET_REF) e usar `secrets` para tokens/keys (não expor nos logs).
- Passos:
  - Login Supabase com token secreto
  - Linkar SOURCE, `supabase db pull`
  - Linkar TARGET, `supabase db push`
  - Setar secrets das functions (TARGET_URL, SERVICE_ROLE_KEY, KIWIFY_WEBHOOK_SECRET, FIREBASE_SERVER_KEY)
  - `functions deploy` para todas Edge Functions

2) README com botão “Deploy to Supabase”
- Adicionar seção com badge/botão que aponta para `https://github.com/<org>/<repo>/actions/workflows/supabase-replicate.yml` com instruções:
  - “Clique no botão, entre em Actions, defina secrets se ainda não fez, e clique em Run workflow”
  - Lista de secrets: `SUPABASE_SOURCE_REF`, `SUPABASE_TARGET_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_TARGET_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `KIWIFY_WEBHOOK_SECRET`, `FIREBASE_SERVER_KEY` (opcional)

3) Opcional: Importação de código via workflow
- Incluir passos que, se `SOURCE_REPO_URL` e `TARGET_DIR` forem fornecidos, clonam o repo fonte e copiam `src/`, `public/`, `supabase/`, `vite.config.ts`, `tailwind.config.ts`, `index.html`, `vercel.json`, `package.json` para `TARGET_DIR`.
- Manter logs `IMPORT_CODE_OK` e rollback opcional.

4) Segurança
- Nunca coletar `service_role_key` via inputs (usar secrets).
- Marcar passos sensíveis para mascarar outputs.

5) Entregáveis
- Workflow `supabase-replicate.yml` com `workflow_dispatch` + inputs opcionais
- Seção de README com botão e guia de execução
- Teste do workflow em um repositório de exemplo

## Confirmação
- Ao aprovar, implemento os ajustes: adicionar inputs ao workflow, criar a seção “Deploy to Supabase” com botão e guia, e (opcional) incluir a importação de código no workflow.