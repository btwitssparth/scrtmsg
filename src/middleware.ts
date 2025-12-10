// src/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const authRoutes = ["/signin", "/signup", "/"];
const protectedPrefix = "/dashboard";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If user is logged in and tries to go to signin/signup/home → send to dashboard
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If user is NOT logged in and tries to access protected route → send to signin
  if (!token && pathname.startsWith(protectedPrefix)) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // Otherwise, allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",              // home
    "/signin",
    "/signup",
    "/dashboard/:path*",
    "/verify/:path*", // you can customize logic for this if needed
  ],
};
