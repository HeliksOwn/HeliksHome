async function refreshAccessToken() {
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
  return data.access_token;
}

export default async function handler(req, res) {
  let token = process.env.NETATMO_TOKEN;

  let response = await fetch("https://api.netatmo.com/api/getstationsdata", {
    headers: { "Authorization": "Bearer " + token }
  });
  let data = await response.json();

  if (data.error && data.error.code === 3) {
    token = await refreshAccessToken();
    response = await fetch("https://api.netatmo.com/api/getstationsdata", {
      headers: { "Authorization": "Bearer " + token }
    });
    data = await response.json();
  }

  res.status(200).json(data);
}