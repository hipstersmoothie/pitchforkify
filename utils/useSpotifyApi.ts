import { useCallback, useContext, useMemo } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { Review } from "../pages/api/reviews";
import { AlbumUserMetadataContext } from "./context";
import { DEVICE_NAME, PlayerContext } from "./PlayerContext";
import { useSpotifyAccessToken } from "./useSpotifyAccessToken";

export const useSpotifyApi = () => {
  const spotifyAccessToken = useSpotifyAccessToken();
  const spotifyApi = useMemo(() => {
    if (spotifyAccessToken) {
      return new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        accessToken: spotifyAccessToken,
      });
    }

    return null;
  }, [spotifyAccessToken]);

  return spotifyApi;
};

export const usePlayAlbum = () => {
  const { playerId, player } = useContext(PlayerContext);
  const { played } = useContext(AlbumUserMetadataContext);
  const spotifyApi = useSpotifyApi();

  return useCallback(
    async (review: Review) => {
      if (!spotifyApi || !review.spotifyAlbum) {
        return;
      }

      const {
        body: { devices },
      } = await spotifyApi.getMyDevices();
      const appPlayer = devices.find((d) => d.name === DEVICE_NAME);

      if (!appPlayer) {
        return;
      }

      const device_id = playerId || appPlayer.id;

      if (!device_id) {
        return;
      }

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
    [spotifyApi, playerId, played, player]
  );
};
