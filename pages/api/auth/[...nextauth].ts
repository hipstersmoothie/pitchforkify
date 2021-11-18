import NextAuth, { User } from "next-auth";
import Providers from "next-auth/providers";

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
    async jwt(token, user) {
      if (user) {
        token.accessToken = user.accessToken;
      }
      return token;
    },
  },
});
