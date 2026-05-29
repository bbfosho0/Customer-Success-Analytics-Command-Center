const DEFAULT_API_BASE_URL = "http://localhost:8000";

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export function isStaticDemoMode() {
  return (
    process.env.NEXT_PUBLIC_DATA_MODE === "static" ||
    process.env.NEXT_PUBLIC_STATIC_DEMO === "true" ||
    process.env.GITHUB_PAGES === "true" ||
    (typeof window !== "undefined" && window.location.hostname.endsWith("github.io"))
  );
}

export function isRefreshManifestEnabled() {
  return !isStaticDemoMode() && process.env.NEXT_PUBLIC_ENABLE_REFRESH_ENDPOINT === "true";
}
