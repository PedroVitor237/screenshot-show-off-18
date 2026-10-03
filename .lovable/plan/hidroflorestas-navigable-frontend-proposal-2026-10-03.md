# HidroFlorestas — navigable frontend proposal

A clickable demo of the full brief, in Brazilian Portuguese, using only made-up data. There is no real backend, no Lovable Cloud and no real sign-in. A "Demonstração" panel lets you switch between profiles and scenarios.

## Visual identity (taken from the brief)
- Light neutral backgrounds (#F9FAFB, #FFFFFF, #EFEFEF) with text in #3E3E3E.
- Green, blue and ochre used only as small accents: green-600/700, #0084DD and amber-700/#A1640B.
- Poppins font, 20px rounded cards, 10px rounded controls, the soft shadow from the brief, and Lucide icons with labels.
- A temporary text wordmark "HidroFlorestas". No neon colors and no strong gradients.
- Color contrast checked against WCAG AA. Any color adjustments are recorded in the README.

## Screens (every route in the brief)
- Public pages: `/`, `/login`, `/register` (desktop has an illustrated panel next to the form), `/logout` (shows a success state and an error-with-retry state).
- `/workspace`: shows no laboratory, a list of up to five, the limit reached, and lab creation. Settings open in a dialog, with deactivate/delete that require typing the lab name. "Solicitar participação" is shown as "Ainda indisponível".
- Inside a lab (`/dashboard/laboratories/$labId`): a side menu with Resumo, Áreas, Mapa, and Membros (owner only). On mobile this becomes a drawer. A breadcrumb trail and the Sair button are always visible.
  - Summary: totals and a history list paged by cursor ("Carregar mais").
  - Areas: a card grid, an empty state, and "Nova área". The area form has manual coordinates, a click-on-map point, device location on request, a late-location case, and a review step.
  - Area detail and new collection: date/time with time zone or UTC offset, validation, a review step, and Corrigir/Confirmar.
  - Collection detail: links to environmental data and the IHFR section (experimental notice, create/replace/revoke, recovery of uncertain attempts).
  - Environmental data: four groups with the exact fields and enums, null/zero/false handled correctly, then review and confirmation.
  - Map: area points plus a list you can use with the keyboard, an "area without location" case, and a fallback when map tiles fail to load.
  - Members: promote or demote between Membro and Administrador, with a conflict case.
- `/admin` and `/admin/users`: search, filters, pagination, account details, and role or status changes with a reason, a before/after review and confirmation. Also shows a conflict case and the audit log.
- The old routes redirect: `/dashboard` and `/dashboard/collects` go to `/workspace`, and `/dashboard/admin/users` goes to `/admin/users`.

## Demo scenarios
- Profiles: OWNER, contextual ADMIN, MEMBER, global ADMIN, account with no lab, and inactive lab.
- Controlled toggles to show each state: delay, network failure, logout failure, location denied or late, tiles unavailable, and the IHFR outcomes (absent, insufficient, incompatible version, current, unknown result with recovery or replay, 409 conflict).
- All IHFR results are fixed fixtures labeled "Resultado simulado — demonstração". Nothing is calculated.

## Technical details
- Structure:
  - `src/lib/hf/types.ts`: DTOs with the names from the contracts.
  - `src/lib/hf/adapter.ts`: a single interface that mirrors the endpoints.
  - `src/lib/hf/mock-adapter.ts`: in-memory implementation with fixtures, delays and failures.
  - `src/lib/hf/scenario-store.ts`: the demo session and scenarios, in memory, with no localStorage for tokens.
  - `src/lib/hf/datetime.ts`: RFC3339 with offset, validation of ±14:00 and -00:00, and the no-future-dates rule.
  - `src/lib/hf/labels.ts`: pt-BR labels for each enum.
- Components are grouped in `src/components/hf/` by domain: layout, forms, map, ihfr, admin.
- The demo panel lives in `src/components/demo/`, kept apart so it is easy to remove.
- Data is loaded with TanStack Query through the adapter. Permissions come from a function that checks the role matrix.
- Maps use Leaflet/React-Leaflet with OpenStreetMap tiles. They load only in the browser (lazy-loaded behind ClientOnly), always show attribution, and fall back to "Mapa de demonstração".
- Accessibility: shadcn/Radix dialogs, focus moves to the first invalid field, status and alert announcements, 44px touch targets, reduced motion respected, and layouts tested at 375, 768 and 1440 px plus 200% zoom.
- The README covers how to run the demo, where each part lives, the states shown, and what must change when adapting to Next.js 16 App Router (routes, loaders, client/server boundaries, map). AGENTS.md is updated with the structure rules.
- Each screen gets its own head() with a pt-BR title and description.
- Out of scope, as the brief requires: real backend, IHFR calculation, uploads, polygons, PDF, AI, invitations and password recovery.
- Exporting to GitHub is done by you through the GitHub connection in Lovable.
