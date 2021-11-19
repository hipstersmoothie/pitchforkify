import NextAuth, { User } from "next-auth";
import { JWT } from "next-auth/jwt";
import Providers from "next-auth/providers";

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64"),
        },
        body: new URLSearchParams({
          client_id: process.env.SPOTIFY_CLIENT_ID,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        }),
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export default NextAuth({
  providers: [
    Providers.Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      scope:
        "user-read-email user-read-private streaming user-read-currently-playing user-read-playback-state user-modify-playback-state user-library-modify user-library-read",

      profile: async (profile, tokens) => {
        return {
          id: profile.id,
          name: profile.display_name,
          email: profile.email,
          accessToken: tokens.accessToken,
          image: profile.images?.[0]?.url,
        } as User & { id: string };
      },
    }),
  ],
  callbacks: {
    async session(session, token) {
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt(token, user, account) {
      // Initial sign in
      if (user && account) {
        token.accessToken = user.accessToken;
        token.refreshToken = account.refreshToken;
        token.accessTokenExpires =
          Date.now() + (account.expires_in as number) * 1000;

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
