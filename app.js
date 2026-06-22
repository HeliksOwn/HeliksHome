  function showTab(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    el.classList.add('active');
  }

    async function fetchWeather() {
    try {
      const res = await fetch("/api/netatmo");
      const data = await res.json();
      
      if (!data.body || !data.body.devices || data.body.devices.length === 0) {
        document.getElementById("temp-in").textContent = "Ikke tilgjengelig";
        document.getElementById("humidity-in").textContent = "Ikke tilgjengelig";
        document.getElementById("co2").textContent = "Ikke tilgjengelig";
        document.getElementById("noise").textContent = "Ikke tilgjengelig";
        document.getElementById("pressure").textContent = "Ikke tilgjengelig";
        console.warn("Netatmo data ikke tilgjengelig", data);
        return;
      }
      
      const indoor = data.body.devices[0].dashboard_data;

      document.getElementById("temp-in").textContent = indoor.Temperature + "°C";
      document.getElementById("humidity-in").textContent = indoor.Humidity + "%";
      document.getElementById("co2").textContent = indoor.CO2 + " ppm";
      document.getElementById("noise").textContent = indoor.Noise + " dB";
      document.getElementById("pressure").textContent = indoor.Pressure + " hPa";

      const outdoor = data.body.devices[0].modules.find(m => m.type === "NAModule1");
      if (outdoor && outdoor.dashboard_data) {
          document.getElementById("temp-out").textContent = outdoor.dashboard_data.Temperature + "°C";
          document.getElementById("humidity-out").textContent = outdoor.dashboard_data.Humidity + "%";
      }
    } catch (error) {
      console.error("Feil ved henting av værvær-data:", error);
      document.getElementById("temp-in").textContent = "Feil";
      document.getElementById("humidity-in").textContent = "Feil";
    }
  }

// --- ENTUR ---
  const STOPS = [
    { id: "NSR:StopPlace:58353", name: "Bislett", elementId: "bislett" },
    { id: "NSR:StopPlace:6286",  name: "Colletts gate", elementId: "colletts" },
    { id: "NSR:StopPlace:58291", name: "Homansbyen", elementId: "homansbyen" }
  ];

  async function fetchDepartures(stop) {
    const query = `{
      stopPlace(id: "${stop.id}") {
        estimatedCalls(timeRange: 3600, numberOfDepartures: 30) {
          expectedDepartureTime
          destinationDisplay { frontText }
          serviceJourney {
            journeyPattern {
              line { publicCode transportMode }
            }
          }
          realtime
        }
      }
    }`;
    const res = await fetch("https://api.entur.io/journey-planner/v3/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ET-Client-Name": "helikshome-dashboard"
      },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    return data.data.stopPlace.estimatedCalls;
  }

  function formatTime(isoString) {
    const d = new Date(isoString);
    const now = new Date();
    const diffMin = Math.round((d - now) / 60000);
    if (diffMin <= 0) return "Nå";
    if (diffMin < 60) return diffMin + " min";
    return d.toTimeString().slice(0, 5);
  }

  function renderDepartures(calls, elementId) {
  const el = document.getElementById(elementId);
  if (!calls || calls.length === 0) {
    el.innerHTML = '<p style="color:#aaa">Ingen avganger funnet</p>';
    return;
  }

  const byLine = {};
  for (const call of calls) {
    const code = call.serviceJourney.journeyPattern.line.publicCode;
    if (!byLine[code]) byLine[code] = [];
    byLine[code].push(call);
  }

  const grid = document.createElement("div");
  grid.className = "lines-grid";
  el.innerHTML = "";

  for (const [lineCode, departures] of Object.entries(byLine)) {
    const group = document.createElement("div");
    group.className = "line-group";

    const mode = departures[0].serviceJourney.journeyPattern.line.transportMode;
    const modeLabel = mode === "tram" ? "Trikk" : mode === "bus" ? "Buss" : mode;

    group.innerHTML = `
      <div class="line-header">
        <span class="line-badge">${lineCode}</span>
        <span class="line-name">${modeLabel}</span>
      </div>
    `;

    for (const dep of departures.slice(0, 4)) {
      const dest = dep.destinationDisplay.frontText;
      const div = document.createElement("div");
      div.className = "departure";
      div.innerHTML = `
        <span class="direction-arrow">→</span>
        <span class="dest">${dest}</span>
        ${dep.realtime ? '<span class="realtime-dot"></span>' : ''}
        <span class="time">${formatTime(dep.expectedDepartureTime)}</span>
      `;
      group.appendChild(div);
    }
    grid.appendChild(group);
  }
  el.appendChild(grid);
}

  async function fetchAllDepartures() {
    for (const stop of STOPS) {
      const calls = await fetchDepartures(stop);
      renderDepartures(calls, stop.elementId);
    }
  }

  fetchWeather();
  setInterval(fetchWeather, 5 * 60 * 1000);
  fetchAllDepartures();
  setInterval(fetchAllDepartures, 60 * 1000);

  const WEATHER_SYMBOLS = {
  clearsky_day: "☀️", clearsky_night: "🌙", clearsky_polartwilight: "🌅",
  fair_day: "🌤", fair_night: "🌤", fair_polartwilight: "🌤",
  partlycloudy_day: "⛅", partlycloudy_night: "⛅", partlycloudy_polartwilight: "⛅",
  cloudy: "☁️", fog: "🌫",
  lightrainshowers_day: "🌦", lightrainshowers_night: "🌦",
  rainshowers_day: "🌧", rainshowers_night: "🌧",
  heavyrainshowers_day: "⛈", heavyrainshowers_night: "⛈",
  lightrain: "🌦", rain: "🌧", heavyrain: "⛈",
  lightsleet: "🌨", sleet: "🌨", heavysleet: "🌨",
  lightsnow: "❄️", snow: "❄️", heavysnow: "❄️",
  thunderstorm: "⛈", thunder: "⛈",
};

function getSymbol(code) {
  return WEATHER_SYMBOLS[code] || "🌡";
}

let allWeatherData = null;

function showHourlyForecast(dateStr) {
  if (!allWeatherData) return;
  
  const timeseries = allWeatherData.forecast.properties.timeseries;
  const hourlyData = timeseries.filter(t => {
    const tDate = new Date(t.time).toISOString().slice(0, 10);
    return tDate === dateStr;
  });
  
  const hourlyEl = document.getElementById("hourly-forecast");
  hourlyEl.innerHTML = `<h3>${new Date(dateStr).toLocaleDateString('no-NO', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>`;
  
  const hourlyGrid = document.createElement("div");
  hourlyGrid.className = "hourly-grid";
  
  for (const t of hourlyData) {
    const time = new Date(t.time);
    const temp = t.data.instant.details.air_temperature?.toFixed(1) ?? "--";
    const windSpeed = t.data.instant.details.wind_speed?.toFixed(1) ?? "--";
    const humidity = t.data.instant.details.relative_humidity?.toFixed(0) ?? "--";
    const symbol = t.data.next_1_hours?.summary?.symbol_code ?? "";
    const rain = t.data.next_1_hours?.details?.precipitation_amount?.toFixed(1) ?? "0";
    
    const hourDiv = document.createElement("div");
    hourDiv.className = "hourly-card";
    hourDiv.innerHTML = `
      <span class="hour-time">${time.getHours().toString().padStart(2, '0')}:00</span>
      <span class="hour-icon">${getSymbol(symbol)}</span>
      <span class="hour-temp">${temp}°C</span>
      <span class="hour-detail">💨 ${windSpeed} m/s</span>
      <span class="hour-detail">💧 ${rain} mm</span>
      <span class="hour-detail">💦 ${humidity}%</span>
    `;
    hourlyGrid.appendChild(hourDiv);
  }
  
  hourlyEl.appendChild(hourlyGrid);
}

async function fetchNature() {
  const res = await fetch("/api/yr");
  const data = await res.json();
  allWeatherData = data;

  // Soloppgang/solnedgang
  const sunriseTime = new Date(data.sunrise.properties.sunrise.time);
  const sunsetTime = new Date(data.sunrise.properties.sunset.time);
  document.getElementById("sunrise").textContent = sunriseTime.toTimeString().slice(0, 5);
  document.getElementById("sunset").textContent = sunsetTime.toTimeString().slice(0, 5);

  // UV og pollen fra neste time
  const timeseries = data.forecast.properties.timeseries;
  const now = new Date();
  const current = timeseries.find(t => new Date(t.time) >= now);
  if (current) {
    const details = current.data.instant.details;
    document.getElementById("uv").textContent = details.ultraviolet_index_clear_sky?.toFixed(1) ?? "--";
  }

  // Pollen ikke tilgjengelig via Yr API – vis info
  // document.getElementById("pollen").textContent = "Se naaf.no";

  // 7-dagersprognose – én per dag kl 12:00
  const days = {};
    for (const t of timeseries) {
    const d = new Date(t.time);
    const dateKey = d.toISOString().slice(0, 10);
    // Foretrekk kl 12, men ta første tilgjengelige hvis ikke
    if (!days[dateKey]) {
        days[dateKey] = t;
    } else if (d.getHours() === 12) {
        days[dateKey] = t;
    }
    }

    const forecastEl = document.getElementById("forecast");
        forecastEl.innerHTML = "";
        forecastEl.className = "forecast-grid";
        const dayNames = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];

        for (const [date, t] of Object.entries(days).slice(0, 8)) {
        const d = new Date(date);
        const dayName = dayNames[d.getDay()];
        const dateStr = `${dayName} ${d.getDate()}.${d.getMonth() + 1}`;
        const temp = t.data.instant.details.air_temperature?.toFixed(0) ?? "--";
        const symbol = t.data.next_6_hours?.summary?.symbol_code ?? t.data.next_1_hours?.summary?.symbol_code ?? "";
        const rain = t.data.next_6_hours?.details?.precipitation_amount?.toFixed(1) ?? "--";

        const div = document.createElement("div");
        div.className = "forecast-day";
        div.style.cursor = "pointer";
        div.innerHTML = `
            <span class="forecast-date">${dateStr}</span>
            <span class="forecast-icon">${getSymbol(symbol)}</span>
            <span class="forecast-temp">${temp}°C</span>
            <span class="forecast-rain">💧 ${rain} mm</span>
        `;
        div.onclick = () => showHourlyForecast(date);
        forecastEl.appendChild(div);
    }
}

fetchNature();
setInterval(fetchNature, 30 * 60 * 1000);
