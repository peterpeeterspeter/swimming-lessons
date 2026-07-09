export const GOOGLE_API_CREDENTIALS = process.env.GOOGLE_API_CREDENTIALS || "{}";
export const { client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET } =
  JSON.parse(GOOGLE_API_CREDENTIALS)?.web || {};
export const GOOGLE_LOGIN_ENABLED = process.env.GOOGLE_LOGIN_ENABLED === "true";
export const IS_GOOGLE_LOGIN_ENABLED = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_LOGIN_ENABLED);
export const IS_SAML_LOGIN_ENABLED = !!(process.env.SAML_DATABASE_URL && process.env.SAML_ADMINS);

// GitHub
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
export const IS_GITHUB_LOGIN_ENABLED = !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);

// Facebook
export const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID || "";
export const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET || "";
export const IS_FACEBOOK_LOGIN_ENABLED = !!(FACEBOOK_CLIENT_ID && FACEBOOK_CLIENT_SECRET);
