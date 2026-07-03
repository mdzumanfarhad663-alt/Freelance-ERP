import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma imports) shared by middleware and the full
// auth setup in auth.ts.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isProtected = ["/dashboard", "/clients", "/projects", "/tasks", "/invoices"].some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      );

      if (isProtected) return isLoggedIn;

      if (pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // filled in by auth.ts
} satisfies NextAuthConfig;
