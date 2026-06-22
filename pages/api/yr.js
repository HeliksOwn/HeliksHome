export default async function handler(req, res) {
  res.setHeader("x-helikshome-api", "yr");
  res.setHeader("x-helikshome-api-version", "2026-06-22-netatmo-route-cleanup");

  const lat = 59.9269;
  const lon = 10.7359;

  const forecast = await fetch(
    `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${lon}`,
    { headers: { "User-Agent": "helikshome-dashboard github.com/HeliksOwn/HeliksHome" } }
  );
  const forecastData = await forecast.json();

  const sunrise = await fetch(
    `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${lon}&date=${new Date().toISOString().slice(0,10)}&offset=+02:00`,
    { headers: { "User-Agent": "helikshome-dashboard github.com/HeliksOwn/HeliksHome" } }
  );
  const sunriseData = await sunrise.json();

  res.status(200).json({ forecast: forecastData, sunrise: sunriseData });
}