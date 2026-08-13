import { loadManifest } from '@angular-architects/module-federation';
import {environment} from './environments/environment';

const manifest = environment.production
? '/mf.manifest.prod.json'
  : '/mf.manifest.json';

loadManifest(manifest)
  .catch(err => console.error('Error cargando manifest:', err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error('Error iniciando aplicación:', err));
