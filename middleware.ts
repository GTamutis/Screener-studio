import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getMiddlewareAppAccess } from "@/lib/auth/middleware-access";
import { readClerkAppMetadata } from "@/lib/auth/metadata";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/invite(.*)",
  "/api/webhooks(.*)",
]);

const isPendingRoute = createRouteMatcher(["/pending-approval(.*)"]);
const isAccessDeniedRoute = createRouteMatcher(["/access-denied(.*)"]);
const isAdminUsersRoute = createRouteMatcher(["/workspace/users(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  const { userId, sessionClaims } = await auth.protect();
  const sessionMeta = readClerkAppMetadata(sessionClaims?.publicMetadata);
  const meta = await getMiddlewareAppAccess(userId, sessionMeta);

  if (!meta) {
    return;
  }

  if (meta.appStatus === "pending") {
    if (!isPendingRoute(request)) {
      return NextResponse.redirect(new URL("/pending-approval", request.url));
    }
    return;
  }

  if (meta.appStatus === "disabled") {
    if (!isAccessDeniedRoute(request)) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }
    return;
  }

  if (meta.appStatus === "active") {
    if (isPendingRoute(request) || isAccessDeniedRoute(request)) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
    if (isAdminUsersRoute(request) && meta.appRole !== "admin") {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
  }

});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
