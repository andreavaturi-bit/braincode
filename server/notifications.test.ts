/**
 * Test per la logica di notifiche utente.
 * Verifica che le query helper per le notifiche funzionino correttamente.
 */
import { describe, it, expect } from "vitest";

// Test della logica di costruzione dei messaggi di notifica
// (stessa logica usata in scripts/recalc-results.ts)

function buildNotificationMessage(changes: Array<{
  oldVerde: number; oldRosso: number; oldBlu: number;
  newVerde: number; newRosso: number; newBlu: number;
  oldProfile: string; newProfile: string;
  profileChanged: boolean;
}>): { title: string; message: string } {
  const title = "Il tuo profilo BrainCode è stato aggiornato";
  const testCount = changes.length;

  let message: string;
  if (testCount === 1) {
    const c = changes[0];
    if (c.profileChanged) {
      message = `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
        `Il tuo profilo aggiornato è: ${c.newProfile} ` +
        `(Verde: ${c.newVerde}, Rosso: ${c.newRosso}, Blu: ${c.newBlu}). ` +
        `Il precedente risultato era: ${c.oldProfile} ` +
        `(Verde: ${c.oldVerde}, Rosso: ${c.oldRosso}, Blu: ${c.oldBlu}).`;
    } else {
      message = `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
        `Il tuo profilo rimane ${c.newProfile}, ma i punteggi sono stati aggiornati: ` +
        `Verde: ${c.oldVerde}→${c.newVerde}, Rosso: ${c.oldRosso}→${c.newRosso}, Blu: ${c.oldBlu}→${c.newBlu}.`;
    }
  } else {
    message = `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
      `${testCount} dei tuoi test sono stati aggiornati con i punteggi corretti. ` +
      `Accedi alla tua dashboard per vedere i risultati aggiornati.`;
  }

  return { title, message };
}

describe("buildNotificationMessage", () => {
  it("genera messaggio corretto per singolo test con profilo cambiato", () => {
    const { title, message } = buildNotificationMessage([{
      oldVerde: 16, oldRosso: 10, oldBlu: 10,
      newVerde: 22, newRosso: 11, newBlu: 3,
      oldProfile: "Dominante VERDE",
      newProfile: "Dominante VERDE con seconda componente ROSSO",
      profileChanged: true,
    }]);

    expect(title).toBe("Il tuo profilo BrainCode è stato aggiornato");
    expect(message).toContain("Dominante VERDE con seconda componente ROSSO");
    expect(message).toContain("Verde: 22, Rosso: 11, Blu: 3");
    expect(message).toContain("Dominante VERDE");
    expect(message).toContain("Verde: 16, Rosso: 10, Blu: 10");
  });

  it("genera messaggio corretto per singolo test senza cambio profilo", () => {
    const { title, message } = buildNotificationMessage([{
      oldVerde: 14, oldRosso: 10, oldBlu: 12,
      newVerde: 15, newRosso: 9, newBlu: 12,
      oldProfile: "Dominante BLU con seconda componente VERDE",
      newProfile: "Dominante BLU con seconda componente VERDE",
      profileChanged: false,
    }]);

    expect(title).toBe("Il tuo profilo BrainCode è stato aggiornato");
    expect(message).toContain("Il tuo profilo rimane Dominante BLU con seconda componente VERDE");
    expect(message).toContain("Verde: 14→15");
    expect(message).toContain("Rosso: 10→9");
  });

  it("genera messaggio aggregato per utente con più test aggiornati", () => {
    const { title, message } = buildNotificationMessage([
      {
        oldVerde: 14, oldRosso: 10, oldBlu: 12,
        newVerde: 15, newRosso: 9, newBlu: 12,
        oldProfile: "Dominante BLU", newProfile: "Dominante BLU",
        profileChanged: false,
      },
      {
        oldVerde: 8, oldRosso: 9, oldBlu: 19,
        newVerde: 9, newRosso: 8, newBlu: 19,
        oldProfile: "Dominante BLU", newProfile: "Dominante BLU",
        profileChanged: false,
      },
      {
        oldVerde: 12, oldRosso: 11, oldBlu: 13,
        newVerde: 13, newRosso: 10, newBlu: 13,
        oldProfile: "Dominante BLU", newProfile: "Dominante VERDE con seconda componente BLU",
        profileChanged: true,
      },
    ]);

    expect(title).toBe("Il tuo profilo BrainCode è stato aggiornato");
    expect(message).toContain("3 dei tuoi test");
    expect(message).toContain("dashboard");
  });

  it("il titolo è sempre lo stesso indipendentemente dal contenuto", () => {
    const cases = [
      [{ oldVerde: 1, oldRosso: 1, oldBlu: 34, newVerde: 2, newRosso: 1, newBlu: 33, oldProfile: "A", newProfile: "B", profileChanged: true }],
      [{ oldVerde: 1, oldRosso: 1, oldBlu: 34, newVerde: 2, newRosso: 1, newBlu: 33, oldProfile: "A", newProfile: "A", profileChanged: false }],
    ];

    for (const c of cases) {
      const { title } = buildNotificationMessage(c);
      expect(title).toBe("Il tuo profilo BrainCode è stato aggiornato");
    }
  });
});
