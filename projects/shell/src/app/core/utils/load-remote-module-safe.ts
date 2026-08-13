import {loadRemoteModule} from '@angular-architects/module-federation';

export async function loadRemoteModuleSafe(remoteName: string, exposedModule: string, retries = 2): Promise<any> {
  try {
    return await loadRemoteModule(remoteName, exposedModule);
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Module Federation] Reintentando cargar "${remoteName}"... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return loadRemoteModuleSafe(remoteName, exposedModule, retries - 1);
    }
    console.error(`[Module federation] Error cargando remote ${remoteName}: ${error}`);
    return {
      routes: [
        {
          path: '',
          loadComponent: () => import('../../shared/remote-error/remote-error.component').then(m => m.RemoteErrorComponent)
        }
      ]
    };
  }
}
