import { execSync } from "node:child_process";

function getRepoName() {
  const envRepo = process.env.NEXT_PUBLIC_REPO_SLUG || process.env.GITHUB_REPOSITORY?.split("/").at(-1);
  if (envRepo) return envRepo;

  try {
    const remote = execSync("git config --get remote.origin.url", { encoding: "utf8" }).trim();
    const match = remote.match(/([^/\\]+?)(?:\.git)?$/);
    if (match?.[1]) return match[1];
  } catch {
    // Fall through to the legacy slug so local non-git builds still work.
  }

  return "aws-serverless-support-analytics";
}

const repoName = getRepoName();
const isProductionBuild = process.env.NODE_ENV === "production";
const isGithubPages = isProductionBuild && process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isProductionBuild ? "export" : undefined,
  basePath: isGithubPages ? `/${repoName}` : undefined,
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
