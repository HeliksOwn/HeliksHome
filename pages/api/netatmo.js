let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
let runtimeRefreshToken = process.env.NETATMO_REFRESH_TOKEN || null;

function isTokenStillValid() {
  return cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt;
}

async function refreshAccessToken() {
  const clientId = process.env.NETATMO_CLIENT_ID;
  const clientSecret = process.env.NETATMO_CLIENT_SECRET;
  const refreshToken = runtimeRefreshToken || process.env.NETATMO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Netatmo env vars: NETATMO_CLIENT_ID / NETATMO_CLIENT_SECRET / NETATMO_REFRESH_TOKEN");
  }

  console.log("Attempting Netatmo token refresh with CLIENT_ID prefix:", clientId.slice(0, 8) + "...");

  const res = await fetch("https://api.netatmo.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    })
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorCode = data?.error || "unknown_error";
    const description = data?.error_description || "No error_description from Netatmo";
    console.error("Netatmo token refresh failed:", { status: res.status, error: errorCode, error_description: description });
    throw new Error(`Netatmo refresh failed (${errorCode}): ${description}`);
  }

  cachedAccessToken = data.access_token;
  cachedAccessTokenExpiresAt = Date.now() + Math.max((data.expires_in || 3600) - 30, 60) * 1000;

  if (data.refresh_token) {
    runtimeRefreshToken = data.refresh_token;
  }

  console.log("Netatmo token refresh successful");
  return cachedAccessToken;
}

async function getStationsData(token) {
  const response = await fetch("https://api.netatmo.com/api/getstationsdata", {
    headers: { "Authorization": "Bearer " + token }
  });
  return response.json();
}

export default async function handler(req, res) {
  try {
    res.setHeader("x-helikshome-api", "netatmo");
    res.setHeader("x-helikshome-api-version", "2026-06-22-netatmo-route-cleanup");

    let token = isTokenStillValid() ? cachedAccessToken : (process.env.NETATMO_TOKEN || "");
    let data = await getStationsData(token);

    if (data?.error && (data.error.code === 2 || data.error.code === 3)) {
      console.log("Netatmo access token invalid/expired, attempting refresh...");
      token = await refreshAccessToken();
      data = await getStationsData(token);
    }

    if (data.error) {
      console.error("Netatmo API error:", data.error);
      return res.status(401).json({ error: data.error });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Netatmo handler error:", error);
    res.status(500).json({
      error: error.message,
      hint: "Check Netatmo credentials in Vercel (CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN)"
    });
  }
}