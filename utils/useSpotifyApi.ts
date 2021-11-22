import { signIn, useSession } from "next-auth/client";
import { useCallback, useContext, useMemo } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { Review } from "../pages/api/reviews";
import { DEVICE_NAME, PlayerContext } from "./PlayerContext";

export const useSpotifyApi = () => {
  const [session] = useSession();
  const spotifyApi = useMemo(
    () =>
      new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        ...session,
      }),
    [session]
  );

  return spotifyApi;
};

export const usePlayAlbum = () => {
  const [session] = useSession();
  const { playerId, player } = useContext(PlayerContext);
  const spotifyApi = useSpotifyApi();

  return useCallback(
    async (review: Review) => {
      if (!session) {
        return signIn();
      }

      const {
        body: { devices },
      } = await spotifyApi.getMyDevices();
      const appPlayer = devices.find((d) => d.name !== DEVICE_NAME);
      const device_id = playerId || appPlayer.id;

      spotifyApi
        .play({ context_uri: review.spotifyAlbum, device_id })
        .then(() => {
          // @ts-ignore
          player.activateElement();
        });
    },
    [player, playerId, session, spotifyApi]
  );
};
