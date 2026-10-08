# HidroFlorestas — demonstração navegável de frontend

Protótipo clicável do HidroFlorestas em português brasileiro, construído com TanStack Start + React 19 + Tailwind CSS v4. **Todos os dados são fictícios**: não há backend real, banco de dados ou autenticação verdadeira. Tudo roda em memória no navegador.

## Como executar

```sh
npm i        # ou bun install
npm run dev  # ou bun dev
```

Abra http://localhost:8080 e entre com uma conta de demonstração (ex.: `ana@demo.hf` com qualquer senha não vazia). O botão **Demonstração** (canto inferior direito) abre o painel para trocar de perfil e simular cenários.

## Perfis de demonstração

| Perfil | E-mail | O que mostra |
| --- | --- | --- |
| Ana — proprietária | `ana@demo.hf` | Laboratório ativo com áreas, coletas e IHFR |
| Bruno — administrador do lab | `bruno@demo.hf` | ADMIN contextual |
| Carla — membro | `carla@demo.hf` | MEMBER + laboratório inativo (somente leitura) |
| Diego — administrador global | `diego@demo.hf` | Telas de `/admin` |
| Elisa — sem laboratório | `elisa@demo.hf` | Workspace vazio |
| Fábio — laboratório inativo | `fabio@demo.hf` | Somente leitura |
| Gabriela — limite de 5 labs | `gabriela@demo.hf` | Criação bloqueada |

## Cenários simulados (painel Demonstração)

- Latência e falha de rede nas chamadas do adapter.
- Falha de logout com tentar novamente.
- Geolocalização negada ou tardia no formulário de área.
- Tiles do mapa indisponíveis (fallback "Mapa de demonstração").
- Resultados do IHFR: ausente, dados insuficientes, versão incompatível, atual, resultado desconhecido com recuperação/repetição, conflito 409.

**Todos os resultados do IHFR são fixtures fixos rotulados "Resultado simulado — demonstração". Nada é calculado.**

## Estrutura do código

- `src/lib/hf/types.ts` — DTOs com os nomes dos contratos HTTP; valores técnicos de enums **não** são traduzidos.
- `src/lib/hf/adapter.ts` — interface `HfAdapter` que espelha os endpoints; na integração real, implemente com `fetch(..., { credentials: "include", cache: "no-store" })`.
- `src/lib/hf/mock-adapter.ts` — implementação em memória com fixtures, atrasos e falhas simuladas.
- `src/lib/hf/scenario-store.ts` — sessão e cenários da demonstração, em memória (sem localStorage para tokens).
- `src/lib/hf/datetime.ts` — RFC3339 com offset explícito; valida ±14:00, rejeita `-00:00` e datas futuras.
- `src/lib/hf/labels.ts` — rótulos pt-BR para cada enum.
- `src/components/hf/` — componentes por domínio (layout, formulários, mapa, ihfr).
- `src/components/demo/` — painel de demonstração, isolado para remoção fácil.
- `src/routes/` — telas: públicas (`/`, `/login`, `/register`, `/logout`), `/workspace`, `/dashboard/laboratories/$labId/*` (Resumo, Áreas, Mapa, Membros), `/admin/*`. Rotas antigas redirecionam (`/dashboard` → `/workspace`, `/dashboard/admin/users` → `/admin/users`).

## Regras importantes do domínio

- **Datas**: `occurredAt` usa RFC3339 com segundos e offset explícito. Nunca anexar "Z" a hora local. `-00:00` é inválido; máximo ±14:00; datas futuras são rejeitadas.
- **IHFR**: seção experimental com aviso visível; operações criar/substituir/revogar usam chaves de idempotência e recuperação via `getOperation`.
- **Mapas**: Leaflet/React-Leaflet com tiles OpenStreetMap, carregados só no navegador (lazy atrás de `ClientOnly`), sempre com atribuição e fallback.
- **Permissões**: matriz em `src/lib/hf/permissions.ts` (apenas UX — o servidor real decide).

## Acessibilidade

Diálogos Radix/shadcn, foco movido ao primeiro campo inválido, anúncios de status/alerta, alvos de toque ≥ 44px, `prefers-reduced-motion` respeitado, contraste AA. Verificado em 375px, 768px e 1440px.

## Fora de escopo (conforme o brief)

Backend real, cálculo do IHFR, uploads, polígonos, PDF, IA, convites e recuperação de senha.

## Migração para Next.js 16 App Router

- Rotas de arquivo (`src/routes/`) viram `app/<rota>/page.tsx`; layouts de laboratório viram `layout.tsx` com `children`.
- Loaders TanStack Query (`ensureQueryData` + `useSuspenseQuery`) viram fetch em Server Components ou `use` com cache do Next.
- `createFileRoute`/`<Link>` viram `next/link`; `useNavigate` vira `useRouter` de `next/navigation`.
- O mapa (Leaflet) precisa de `dynamic(() => import(...), { ssr: false })` — o componente já está isolado em `src/components/hf/map-leaflet.tsx`.
- O adapter (`HfAdapter`) não muda: só troca a implementação mock pela real com `fetch`.
