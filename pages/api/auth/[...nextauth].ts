import NextAuth, { User } from "next-auth";
import { JWT } from "next-auth/jwt";
import SpotifyProvider from "next-auth/providers/spotify";
import SpotifyWebApi from "spotify-web-api-node";

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

export default NextAuth({
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

      profile: async (profile, tokens) => {
        return {
          id: profile.id,
          name: profile.display_name,
          email: profile.email,
          accessToken: tokens.access_token,
          image: profile.images?.[0]?.url,
        } as User & { id: string };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, user, account }) {
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
