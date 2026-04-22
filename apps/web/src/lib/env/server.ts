import "server-only";

const DEFAULT_SERVER_API_BASE_URL = "http://localhost:3333";
const DEFAULT_WEB_SESSION_SECRET = "dev-only-web-session-secret-change-me";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getServerApiBaseUrl(): string {
  const privateApiBaseUrl = process.env.STOCK_CONTROL_API_URL?.trim();
  const publicApiBaseUrl = process.env.NEXT_PUBLIC_STOCK_CONTROL_API_URL?.trim();
  const resolvedApiBaseUrl = privateApiBaseUrl || publicApiBaseUrl || DEFAULT_SERVER_API_BASE_URL;

  if (isProduction() && !privateApiBaseUrl && !publicApiBaseUrl) {
    throw new Error(
      "STOCK_CONTROL_API_URL or NEXT_PUBLIC_STOCK_CONTROL_API_URL must be set in production"
    );
  }

  return resolvedApiBaseUrl;
}

export function getWebSessionSecret(): string {
  const configuredSecret = process.env.WEB_SESSION_SECRET?.trim();
  const secret = configuredSecret || DEFAULT_WEB_SESSION_SECRET;

  if (isProduction() && (!configuredSecret || secret === DEFAULT_WEB_SESSION_SECRET)) {
    throw new Error("WEB_SESSION_SECRET must be explicitly set in production");
  }

  if (isProduction() && secret.length < 32) {
    throw new Error("WEB_SESSION_SECRET must have at least 32 characters in production");
  }

  return secret;
}
