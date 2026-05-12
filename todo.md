# Correzioni di scoring (rev. 2026)

## Correzioni applicate

- [x] Bug Ex 2: scambiati i valori delle combinazioni "6+4-" e "6+5-".
      Verificato contro la foto del libro (image 8).
- [x] Consolidato lo scoring in un unico script `scripts/seed-all.ts`.
      Rimossi gli script obsoleti / bacati.
- [x] Estratta la logica di calcolo in `server/scoring.ts` (modulo puro).
- [x] Aggiunto unit test in `server/scoring.test.ts` con 12 casi di regressione.
- [x] Hardening del calcolo: clamp degli indici, validazione input malformato.
- [x] Schema ripulito: rimossa la tabella `affirmationScoring` (mai usata)
      e il campo `bluAdjustment`.
- [x] Aggiunto script `pnpm recalc-results` per ricalcolare i test storici.

## Da fare manualmente dopo il deploy

- [ ] Eseguire `pnpm seed` per ripopolare la tabella `scoringTables` in DB.
- [ ] Eseguire `pnpm recalc-results --dry-run` per vedere quali test cambieranno.
- [ ] Se i cambiamenti hanno senso, eseguire `pnpm recalc-results` senza --dry-run.
- [ ] Eseguire `pnpm db:push` per applicare il drop della tabella `affirmationScoring`.
