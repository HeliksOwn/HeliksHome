async function refreshAccessToken() {
  try {
    console.log("Attempting token refresh with CLIENT_ID:", process.env.NETATMO_CLIENT_ID?.slice(0, 8) + "...");
    const res = await fetch("https://api.netatmo.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.NETATMO_REFRESH_TOKEN,
        client_id: process.env.NETATMO_CLIENT_ID,
        client_secret: process.env.NETATMO_CLIENT_SECRET,
      })
    });
    const data = await res.json();
    
    if (data.error) {
      console.error("Token refresh failed:", data);
      throw new Error(`Refresh failed: ${data.error} - ${data.error_description}`);
    }
    
    console.log("Token refresh successful");
    return data.access_token;
  } catch (error) {
    console.error("Refresh token error:", error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    let token = process.env.NETATMO_TOKEN;

    let response = await fetch("https://api.netatmo.com/api/getstationsdata", {
      headers: { "Authorization": "Bearer " + token }
    });
    let data = await response.json();

    // Hvis token er ugyldig (kode 2) eller utløpt (kode 3), prøv å refresh
    if (data.error && (data.error.code === 2 || data.error.code === 3)) {
      console.log("Token invalid/expired, attempting refresh...");
      token = await refreshAccessToken();
      response = await fetch("https://api.netatmo.com/api/getstationsdata", {
        headers: { "Authorization": "Bearer " + token }
      });
      data = await response.json();
    }

    if (data.error) {
      console.error("Netatmo API error:", data.error);
      return res.status(401).json({ error: data.error });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Netatmo handler error:", error);
    res.status(500).json({ error: error.message });
  }
}