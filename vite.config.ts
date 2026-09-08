import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import targets from './Shared/targets.json' with { type: 'json' };
export default defineConfig(({ mode }) => {
  const target = mode === 'webxr' ? 'webxr' : 'creator';
  const manifest = JSON.stringify({ id: targets[target].id, name: target === 'webxr' ? 'Milzet WebXR' : 'Milzet Creator', short_name: 'Milzet', start_url: './', display: 'standalone', background_color: '#f3f5f5', theme_color: '#102c2b' });
  return {
    plugins: [react(), { name: 'milzet-target-identity', configureServer(server) { server.middlewares.use('/manifest.webmanifest', (_request, response) => { response.setHeader('Content-Type', 'application/manifest+json'); response.end(manifest); }); }, generateBundle() { this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest }); } }],
    build: { outDir: target === 'webxr' ? 'dist-webxr' : 'dist' },
    server: { host: '127.0.0.1', port: 0 }
  };
});
