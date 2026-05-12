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

- [x] Eseguire `pnpm seed` per ripopolare la tabella `scoringTables` in DB.
- [x] Eseguire `pnpm recalc-results --dry-run` per vedere quali test cambieranno.
- [x] Se i cambiamenti hanno senso, eseguire `pnpm recalc-results` senza --dry-run. (30 test aggiornati, 27 utenti notificati)
- [x] Eseguire `pnpm db:push` per applicare il drop della tabella `affirmationScoring` e creazione tabella `userNotifications`.

## Notifiche automatiche agli utenti (12 maggio 2026)

- [x] Implementare notifica automatica agli utenti dopo il ricalcolo
- [x] Notifica deve essere inviata solo agli utenti il cui risultato è cambiato
- [x] Notifica deve essere in-app (o email) e non richiedere azione dall'utente
