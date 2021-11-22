import { useSession } from "next-auth/client";
import { createContext, useEffect, useRef, useState } from "react";

export const DEVICE_NAME = "pitchforkify";

export const PlayerContext =
  createContext<{ player: Spotify.Player; playerId: string }>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [session] = useSession();
  const [playerId, playerIdSet] = useState<string>();
  const player = useRef<Spotify.Player>();

  useEffect(() => {
    if (!session?.accessToken || player.current) {
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
          cb(session.accessToken as string);
        },
      });

      player.current.addListener("ready", ({ device_id }) => {
        console.log("player ready");
        playerIdSet(device_id);
      });

      player.current.connect();
    };

    return () => {
      player.current.disconnect();
    };
  }, [session?.accessToken]);

  return (
    <PlayerContext.Provider value={{ player: player.current, playerId }}>
      {children}
    </PlayerContext.Provider>
  );
};