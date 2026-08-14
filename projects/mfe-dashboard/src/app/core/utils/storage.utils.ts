// Utilidad para saber si estamos en navegador
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

//Funciones para sessionStorage
export function getSessionItem(key: string): string | null {
  return isBrowser() ? sessionStorage.getItem(key) : null;
}

export function setSessionItem(key: string, value: string): void {
  if (isBrowser()) {
    sessionStorage.setItem(key, value);
  }
}
