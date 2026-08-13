import {loadRemoteModule} from '@angular-architects/module-federation';

export function loadRemoteModuleSafe(remoteName: string, exposedModule:string, retries = 2): Promise<any> {
  return loadRemoteModule(remoteName, exposedModule).catch(error => {
    if (retries > 0) {
      console.warn(`[Module Federation] Reintentando cargar "${remoteName}"... (${retries} intentos restantes)`);
      return new Promise(resolve => setTimeout(resolve, 1000))
        .then(() => loadRemoteModuleSafe(remoteName, exposedModule, retries - 1));
    }
    console.error(`[Module federation] Error cargando remote ${remoteName}: ${error}`);

    return {
      routes: [
        {
          path: '',
          loadComponent: () =>
            import('../../shared/remote-error/remote-error.component').then(m => m.RemoteErrorComponent)
        }
      ]
    }
  })
}
