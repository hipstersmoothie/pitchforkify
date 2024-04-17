import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import SpotifyProvider from "next-auth/providers/spotify";
import SpotifyWebApi from "spotify-web-api-node";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import prisma from "../../../utils/primsa";

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT) {
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    spotifyApi.setAccessToken(token.accessToken as string);
    spotifyApi.setRefreshToken(token.refreshToken as string);

    const { body: newTokens } = await spotifyApi.refreshAccessToken();

    if (!newTokens.access_token) {
      throw new Error("Couldn't refresh access token!");
    }

    return {
      ...token,
      accessToken: newTokens.access_token,
      accessTokenExpires: Date.now() + newTokens.expires_in * 1000,
      refreshToken: newTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

declare module "next-auth" {
  interface Session {
    accessToken: string;
    providerAccountId: string;
  }
}

export default NextAuth({
  secret: process.env.SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope:
            "user-read-email user-read-private streaming user-read-currently-playing user-read-playback-state user-modify-playback-state user-library-modify user-library-read",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.providerAccountId = token.providerAccountId as string;
      return session;
    },
    async jwt({ user, account, token }) {
      if (user && account) {
        token.providerAccountId = account.providerAccountId;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at;

        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      return refreshAccessToken(token);
    },
  },
});
