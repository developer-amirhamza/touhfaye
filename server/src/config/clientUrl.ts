// CLIENT_URL can hold multiple comma-separated origins (e.g. the apex and www
// domains). Nothing splits that string automatically, so callers that need a
// single URL (redirect links, emails) must use primaryClientUrl, and CORS
// must check the request origin against the whole list.
const rawClientUrl = process.env.CLIENT_URL || "";

export const clientOrigins = rawClientUrl
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const primaryClientUrl = clientOrigins[0] || "";