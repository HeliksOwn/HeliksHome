// export default async function handler(req, res) {
//   const token = process.env.NETATMO_TOKEN;
//   const response = await fetch("https://api.netatmo.com/api/getstationsdata", {
//     headers: { "Authorization": "Bearer " + token }
//   });
//   const data = await response.json();
//   res.status(200).json(data);
// }

export default async function handler(req, res) {
  const token = process.env.NETATMO_TOKEN;
  res.status(200).json({ tokenFound: !!token, tokenLength: token?.length });
}