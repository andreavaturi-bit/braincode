/**
 * Lista degli amministratori autorizzati ad accedere al pannello admin
 * Identificati tramite email Gmail
 */
export const ADMIN_EMAILS = [
  'andrea.vaturi@gmail.com',
  'mirko.castignani@gmail.com',
  'vantaggiosleale@gmail.com',
  'opzionetika@gmail.com',
];

/**
 * Verifica se un utente è amministratore
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

