# HeliksHome

Et hjemmeinformasjon dashboard som viser:
- **Inneklima**: Temperatur, fuktighet, CO₂, støy og lufttrykk fra Netatmo
- **Værdata**: Værforecast fra Yr (Meteorologisk Institutt)
- **Kollektivtransport**: Avganger fra Ruter (Oslo) via Entur API

## GitHub

**Konto**: [HeliksOwn](https://github.com/HeliksOwn)  
**Repository**: [HeliksHome](https://github.com/HeliksOwn/HeliksHome)

## Bygging og oppstart

### Lokalt utviklingsmiljø

1. **Installer avhengigheter**
   ```bash
   npm install
   ```

2. **Sett opp miljøvariabler** (`.env.local`)
   ```
   NETATMO_CLIENT_ID=<din_client_id>
   NETATMO_CLIENT_SECRET=<din_client_secret>
   NETATMO_TOKEN=<din_access_token>
   NETATMO_REFRESH_TOKEN=<din_refresh_token>
   ```

3. **Start utviklingsserver**
   ```bash
   npm run dev
   ```
   Appen kjører på `http://localhost:3000`

4. **Bygging for produksjon**
   ```bash
   npm run build
   npm start
   ```

## Ekstern server

**Plattform**: Vercel  
**Deployment**: Automatisk deployment fra GitHub via Vercel CI/CD

### Miljøvariabler på Vercel

De samme miljøvariablene som kreves for lokal utvikling må konfigureres i [Vercel project settings](https://vercel.com):
- `NETATMO_CLIENT_ID`
- `NETATMO_CLIENT_SECRET`
- `NETATMO_TOKEN`
- `NETATMO_REFRESH_TOKEN`

### Deploy

Hver push til `main` branchen deployes automatisk til Vercel.

## Prosjektstruktur

```
├── pages/
│   ├── index.js        # HTML-skall (Next.js side)
│   ├── _app.js         # Next.js app-wrapper
│   └── api/
│       ├── netatmo.js  # Netatmo API endpoint
│       ├── yr.js       # Yr værforecast API endpoint
│       └── jeopardy.js # Jeopardy API endpoint
├── app.js              # Frontend logikk og UI (vanilla JS)
├── style.css           # Styling
└── README.md
```

> **Merk**: Bruk `npm run dev` (port 3000) for lokal utvikling. Port 3001 brukes ikke.

## Avhengigheter

- **Frontend**: Vanilla JavaScript
- **Backend**: Next.js API routes
- **APIs**: 
  - Netatmo (inneklima)
  - Yr (værdata)
  - Entur (kollektivtransport)
