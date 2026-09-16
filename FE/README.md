# Nova — Frontend

Interfaccia React + TypeScript di Nova. Documentazione completa del progetto nel [README principale](../README.md).

## Comandi

```bash
npm install      # dipendenze
npm run dev      # server di sviluppo su http://localhost:5173 (inoltra /api al backend)
npm run lint     # ESLint
npm run build    # controllo dei tipi e build di produzione in dist/
```

Il backend deve essere attivo su `http://127.0.0.1:8080`. Per usare un indirizzo diverso:

```powershell
$env:BACKEND_URL = 'http://127.0.0.1:8081'; npm run dev
```
