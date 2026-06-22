import Head from 'next/head'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Import and run the app.js code on client side
    import('../app.js')
  }, [])

  function showTab(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    el.classList.add('active');
  }
  return (
    <>
      <Head>
        <title>HeliksHome</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="tabs">
        <div className="tab" onClick={(e) => { showTab('vaer', e.currentTarget) }}>🌿 W10</div>
        <div className="tab active" onClick={(e) => { showTab('ruter', e.currentTarget) }}>🚌 Ruter</div>
        <div className="tab" onClick={(e) => { showTab('natur', e.currentTarget) }}>🌡  Yr</div>
        <div className="tab" onClick={(e) => { showTab('jeopardy', e.currentTarget) }}>❓ Jeopardy</div>
      </div>

      <div id="vaer" className="page">
        <div className="section-label">Inne</div>
        <div className="grid">
          <div className="card">
            <h2>Temperatur</h2>
            <div className="value" id="temp-in">--°C</div>
          </div>
          <div className="card">
            <h2>Fuktighet</h2>
            <div className="value" id="humidity-in">--%</div>
          </div>
          <div className="card">
            <h2>CO₂</h2>
            <div className="value" id="co2">-- ppm</div>
          </div>
          <div className="card">
            <h2>Støy</h2>
            <div className="value" id="noise">-- dB</div>
          </div>
          <div className="card">
            <h2>Lufttrykk</h2>
            <div className="value" id="pressure">-- hPa</div>
          </div>
        </div>

        <div className="section-label">Ute</div>
        <div className="grid">
          <div className="card">
            <h2>Temperatur</h2>
            <div className="value" id="temp-out">--°C</div>
          </div>
          <div className="card">
            <h2>Fuktighet</h2>
            <div className="value" id="humidity-out">--%</div>
          </div>
        </div>
      </div>

      <div id="ruter" className="page active">
        <div className="stop-section">
          <h2>Bislett</h2>
          <div id="bislett"></div>
        </div>
        <div className="stop-section">
          <h2>Colletts gate</h2>
          <div id="colletts"></div>
        </div>
        <div className="stop-section">
          <h2>Homansbyen</h2>
          <div id="homansbyen"></div>
        </div>
      </div>

      <div id="natur" className="page">
        <div className="natur-grid">
          <div className="natur-card">
            <div className="natur-label">☀️ Soloppgang</div>
            <div className="natur-value" id="sunrise">--:--</div>
          </div>
          <div className="natur-card">
            <div className="natur-label">🌇 Solnedgang</div>
            <div className="natur-value" id="sunset">--:--</div>
          </div>
          <div className="natur-card">
            <div className="natur-label">🔆 UV-indeks</div>
            <div className="natur-value" id="uv">--</div>
          </div>
        </div>

        <div className="forecast-section">
          <h2>7-dagersprognose</h2>
          <div id="forecast"></div>
        </div>

        <div className="hourly-section">
          <div id="hourly-forecast"></div>
        </div>
      </div>

      <div id="jeopardy" className="page">
        <div className="jeopardy-hero">
          <div>
            <div className="section-label jeopardy-label">Open database</div>
            <h2>Jeopardy ticker</h2>
            <p>Fem clues fra samme kategori vises samtidig. Settet skifter automatisk hvert minutt, og tidligere sett ligger i minnet så du kan gå tilbake.</p>
          </div>
          <div className="jeopardy-meta">
            <button className="jeopardy-button" id="jeopardy-prev-set" type="button">← Forrige sett</button>
            <div className="meta-pill" id="jeopardy-set-label">Laster sett…</div>
            <button className="jeopardy-button timer-button" id="jeopardy-answer-timer" type="button">Svar vises om 30s</button>
            <div className="meta-pill" id="jeopardy-source">Source: loading…</div>
          </div>
        </div>

        <div className="jeopardy-panel">
          <div className="jeopardy-board" id="jeopardy-board"></div>
          <div className="jeopardy-footer">
            <div className="meta-pill" id="jeopardy-count">0/5 clues</div>
            <button className="jeopardy-button timer-button" id="jeopardy-timer" type="button">Next set in 60s</button>
          </div>
        </div>
      </div>
    </>
  )
}
