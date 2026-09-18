// Deliberately named middleware.ts, not the new Next.js 16 proxy.ts
// convention this project used until now: Turbopack has a confirmed bug
// (vercel/next.js#93328) that produces an EMPTY middleware-manifest.json
// for proxy.ts in `next build` specifically (dev mode is unaffected, which
// is why local `npm run dev` never surfaced this) — verified directly
// against this project's own build output, not just the tracked issue.
// The practical symptom: every route requiring auth.protect() 404s in
// production instead of redirecting to sign-in. middleware.ts is still a
// fully supported convention in Next 16 (just no longer the recommended
// name), so this is a real fix, not a regression — revert to proxy.ts once
// that Turbopack bug is fixed upstream.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
