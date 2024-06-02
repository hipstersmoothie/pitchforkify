import { createContext, useEffect, useRef, useState } from "react";
import { useSpotifyAccessToken } from "./useSpotifyAccessToken";

export const DEVICE_NAME = "pitchforkify";

export const PlayerContext = createContext<{
  player?: Spotify.Player;
  playerId?: string;
}>({});

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [playerId, playerIdSet] = useState<string>();
  const player = useRef<Spotify.Player>();
  const spotifyAccessToken = useSpotifyAccessToken();

  useEffect(() => {
    if (player.current) {
      return;
    }

    async function attachPlayer() {
      if (!spotifyAccessToken) {
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);

      console.log("attaching player");
      window.onSpotifyWebPlaybackSDKReady = () => {
        player.current = new Spotify.Player({
          name: DEVICE_NAME,
          volume: 1,
          getOAuthToken: (cb) => {
            cb(spotifyAccessToken);
          },
        });

        player.current.addListener("ready", ({ device_id }) => {
          console.log("player ready");
          playerIdSet(device_id);
        });

        player.current.connect();
      };
    }

    attachPlayer();

    return () => {
      if (!player.current) {
        return;
      }

      player.current.disconnect();
    };
  }, [spotifyAccessToken]);

  return (
    <PlayerContext.Provider value={{ player: player.current, playerId }}>
      {children}
    </PlayerContext.Provider>
  );
};
