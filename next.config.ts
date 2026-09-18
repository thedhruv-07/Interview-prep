import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse bundles PDF.js, which loads its worker via a dynamic import
  // Turbopack/Webpack can't resolve correctly once bundled. Keeping it
  // external lets Node resolve it normally at runtime.
  serverExternalPackages: ["pdf-parse"],
  // The floating "N" badge repeatedly flagged by usability audits is
  // Next.js's own dev-mode indicator, not app markup — invisible in
  // production either way, but hiding it keeps dev screenshots/audits clean.
  devIndicators: false,
};

export default nextConfig;
