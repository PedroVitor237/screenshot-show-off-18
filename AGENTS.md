<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- Demo-only frontend: all data comes from `src/lib/hf/mock-adapter.ts` behind the `HfAdapter` interface in `src/lib/hf/adapter.ts`; never add a real backend or localStorage tokens — swap the adapter implementation instead.
- IHFR results are fixed fixtures labeled "Resultado simulado — demonstração"; never compute scores.
- Dates use RFC3339 with explicit offset via `src/lib/hf/datetime.ts` (reject `-00:00`, max ±14:00, no future dates); never append "Z" to local wall time.
- Technical enum values stay untranslated in `types.ts`; pt-BR labels live only in `src/lib/hf/labels.ts`.
- Leaflet maps load only in the browser (lazy behind `ClientOnly`) with OSM attribution and a fallback; the map component stays isolated in `src/components/hf/map-leaflet.tsx`.
- Demo controls live only in `src/components/demo/` so they can be removed cleanly.
- Parent routes that have children render `<Outlet />`; page content lives in `*.index.tsx` leaves.
