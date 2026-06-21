import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

  providers: [
    ...(process.env.AZURE_AD_B2C_CLIENT_ID
      ? [
          {
            id: "azure-ad-b2c",
            name: "Azure AD B2C",
            type: "oauth" as const,
            wellKnown: `https://${process.env.AZURE_AD_B2C_TENANT_NAME}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/${process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW}/v2.0/.well-known/openid-configuration`,
            clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
            authorization: {
              params: {
                scope: "openid profile email offline_access",
              },
            },
            idToken: true,
            profile(profile: Record<string, string>) {
              return {
                id: profile.sub ?? profile.oid,
                name: profile.name ?? profile.given_name,
                email: profile.emails?.[0] ?? profile.email,
                image: null,
                role: UserRole.STUDENT,
              };
            },
          },
        ]
      : []),

    // ─── Credentials Provider (email/password — works without Azure) ──
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Account has been deactivated");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as UserRole,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, add role and id to the token
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
      }

      // Allow session updates (e.g., role change by admin)
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.name) token.name = session.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },

    async signIn({ user, account }) {
      // For OAuth providers, check if user exists and create if not
      if (account?.type === "oauth") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (existingUser && !existingUser.isActive) {
          return false; // Block deactivated users
        }
      }
      return true;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export default authOptions;
