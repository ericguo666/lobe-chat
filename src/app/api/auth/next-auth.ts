import NextAuth from 'next-auth';
import { NextAuth } from 'next-auth';
import Auth0 from 'next-auth/providers/auth0';
import Okta from 'next-auth/providers/okta';

// 引入 Okta 提供者

import { getServerConfig } from '@/config/server';

import { ssoProviders } from './sso-providers';

const { NEXTAUTH_SECRET, ENABLE_OAUTH_SSO, SSO_PROVIDERS } = getServerConfig();

export const initSSOProviders = () => {
  return ENABLE_OAUTH_SSO
    ? SSO_PROVIDERS.split(/[,，]/).map((provider) => {
        const validProvider = ssoProviders.find((item) => item.id === provider);

        if (validProvider) return validProvider.provider;

        throw new Error(`[NextAuth] provider ${provider} is not supported`);
      })
    : [];
};

// 导入服务器配置
const { OKTA_CLIENT_ID, OKTA_CLIENT_SECRET, OKTA_ISSUER } = getServerConfig();

const nextAuth = NextAuth({
  callbacks: {
    // Note: Data processing order of callback: authorize --> jwt --> session
    async jwt({ token, account }) {
      // Auth.js will process the `providerAccountId` automatically
      // ref: https://authjs.dev/reference/core/types#provideraccountid
      if (account) {
        token.userId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Pick userid from token
      if (session.user) {
        session.user.id = token.userId ?? session.user.id;
      }
      return session;
    },
  },
  providers:[initSSOProviders(),
  Okta({
      clientId: OKTA_CLIENT_ID,
      clientSecret: OKTA_CLIENT_SECRET,
      issuer: OKTA_ISSUER,
    }),
  ],
  secret: NEXTAUTH_SECRET,
  trustHost: true,
});

export const {
  handlers: { GET, POST },
  auth,
} = nextAuth;

declare module '@auth/core/jwt' {
  // Returned by the `jwt` callback and `auth`, when using JWT sessions
  interface JWT {
    userId?: string;
  }
}
