import { signIn, useSession } from "next-auth/react";
import { useCallback, useContext, useMemo } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { Review } from "../pages/api/reviews";
import { AlbumUserMetadataContext } from "./context";
import { DEVICE_NAME, PlayerContext } from "./PlayerContext";

export const useSpotifyApi = () => {
  const { data: session } = useSession();
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
  const { data: session } = useSession();
  const { playerId, player } = useContext(PlayerContext);
  const { played } = useContext(AlbumUserMetadataContext);

  return useCallback(
    async (review: Review) => {
      if (!session) {
        return signIn("spotify");
      }

      const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        ...session,
      });

      const {
        body: { devices },
      } = await spotifyApi.getMyDevices();
      const appPlayer = devices.find((d) => d.name !== DEVICE_NAME);
      const device_id = playerId || appPlayer.id;

      spotifyApi
        .play({
          context_uri: review.spotifyAlbum,
          device_id,
        })
        .then(() => {
          // @ts-ignore
          player.activateElement();
        });

      if (!played.includes(review.spotifyAlbum)) {
        fetch("/api/played", {
          method: "PUT",
          body: JSON.stringify({ uri: review.spotifyAlbum }),
        });
      }
    },
    [player, playerId, session, played]
  );
};
