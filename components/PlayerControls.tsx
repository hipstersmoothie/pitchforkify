import { useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import makeClass from "clsx";

import { formatTime } from "../utils/formatTime";

import { PrevIcon } from "../components/icons/PrevIcon";
import { NextIcon } from "../components/icons/NextIcon";
import { UnfilledHeartIcon } from "../components/icons/UnfilledHeartIcon";
import { HeartIcon } from "../components/icons/HeartIcon";
import { usePlayAlbum, useSpotifyApi } from "../utils/useSpotifyApi";
import { PlayerContext } from "../utils/PlayerContext";
import { PlayButton } from "./PlayButton";
import { ReviewsContext } from "../utils/ReviewsContext";
import { PauseIcon } from "./icons/PauseIcon";
import { PlayIcon } from "./icons/PlayIcon";

interface ScrubberBarProps extends React.ComponentProps<"div"> {
  currentTime: number;
  duration: number;
}

const ScrubberBar = ({
  duration,
  currentTime,
  className,
  onClick,
  ...props
}: ScrubberBarProps) => {
  const { player } = useContext(PlayerContext);

  return (
    <div
      className={makeClass("overflow-hidden rounded", className)}
      onClick={(e) => {
        const percent =
          e.nativeEvent.offsetX /
          Number(getComputedStyle(e.target as Element).width.replace("px", ""));

        player.seek(percent * duration);
        onClick?.(e);
      }}
      {...props}
    >
      <div className="h-1 w-full absolute left-0 top-1/2 -translate-y-1/2 bg-gray-400" />
      <div
        style={{
          left: `${(currentTime / duration - 1) * 100}%`,
        }}
        className="h-1 w-full bg-gray-700 absolute top-1/2 -translate-y-1/2"
      />
      <div
        style={{ height: 20 }}
        className="w-full absolute top-0 left-0 cursor-pointer"
      />
    </div>
  );
};

export const PlayerControls = () => {
  const spotifyApi = useSpotifyApi();
  const playAlbum = usePlayAlbum();
  const { reviews } = useContext(ReviewsContext);
  const { player } = useContext(PlayerContext);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerState, playerStateSet] = useState({
    playing: false,
    artist: "",
    track: "",
    duration: 0,
    cover: "",
    isSaved: false,
  });

  const getAlbumFromOffset = useCallback(
    (currentUri: string, offset: number) => {
      const currentReview = reviews.findIndex(
        (r) => r.spotifyAlbum === currentUri
      );
      return reviews[currentReview + offset];
    },
    [reviews]
  );

  useEffect(() => {
    if (!player) {
      return;
    }

    const playerStateChanged = async (newState: Spotify.PlaybackState) => {
      if (!newState) {
        return;
      }

      const trackId = newState.track_window.current_track.id;
      const {
        body: [isSaved],
      } = await spotifyApi.containsMySavedTracks([trackId]);

      setCurrentTime(newState.position);
      playerStateSet({
        playing: !newState.paused,
        artist: newState.track_window.current_track.artists
          .map((a) => a.name)
          .join(", "),
        track: newState.track_window.current_track.name,
        duration: newState.duration,
        cover: newState.track_window.current_track.album.images[1].url,
        isSaved,
      });
    };

    player.addListener("player_state_changed", playerStateChanged);

    return () => {
      if (!player) {
        return;
      }

      player.removeListener("player_state_changed", playerStateChanged);
    };
  }, [player, spotifyApi]);

  useEffect(() => {
    function pressSpace(e: KeyboardEvent) {
      if (e.key === " " && playerState.track) {
        player.togglePlay();
        e.preventDefault();
      }
    }

    document.addEventListener("keydown", pressSpace);

    return () => {
      document.removeEventListener("keydown", pressSpace);
    };
  }, [playerState.track, player]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!player) {
        return;
      }

      player.getCurrentState().then((s) => {
        if (!s) {
          return;
        }

        if (s.position <= playerState.duration) {
          setCurrentTime(s.position);
        } else if (s.track_window.next_tracks.length === 0) {
          const nextAlbum = getAlbumFromOffset(s.context.uri, 1);

          if (nextAlbum) {
            playAlbum(nextAlbum);
          }
        }
      });
    }, 1000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [getAlbumFromOffset, playAlbum, player, playerState.duration, reviews]);

  const playPreviousTrack = useCallback(() => {
    player.getCurrentState().then((s) => {
      if (s?.track_window.previous_tracks.length === 0) {
        const prevAlbum = getAlbumFromOffset(s.context.uri, -1);

        if (prevAlbum) {
          playAlbum(prevAlbum);
        }
      } else {
        player.previousTrack();
      }
    });
  }, [getAlbumFromOffset, playAlbum, player]);

  const playNextTrack = useCallback(() => {
    player.getCurrentState().then((s) => {
      if (s?.track_window.next_tracks.length === 0) {
        const nextAlbum = getAlbumFromOffset(s.context.uri, 1);

        if (nextAlbum) {
          playAlbum(nextAlbum);
        }
      } else {
        player.nextTrack();
      }
    });
  }, [getAlbumFromOffset, playAlbum, player]);

  const toggleFavorite = useCallback(async () => {
    const s = await player.getCurrentState();
    const trackId = s.track_window.current_track.id;
    const {
      body: [isSaved],
    } = await spotifyApi.containsMySavedTracks([trackId]);

    if (isSaved) {
      await spotifyApi.removeFromMySavedTracks([trackId]);
    } else {
      await spotifyApi.addToMySavedTracks([trackId]);
    }

    playerStateSet({ ...playerState, isSaved });
  }, [player, playerState, spotifyApi]);

  if (!playerState.track) {
    return null;
  }

  return (
    <div
      className={makeClass(
        "bg-white h-16 m-1 rounded-md border border-gray-300 shadow-xl fixed left-0 right-0 bottom-0 grid gap-6 border-t items-center z-50 overflow-hidden",
        "md:grid-cols-3 md:h-24 md:m-0 md:rounded-none"
      )}
    >
      <div className="mx-2 flex items-center border-box mb-1 md:mb-0">
        <div
          className={makeClass(
            "h-12 w-12 border mr-3 md:mr-4 border-gray-300 rounded overflow-hidden",
            "md:h-20 md:w-20 md:rounded-none"
          )}
        >
          <Image
            src={playerState.cover}
            alt=""
            height={80}
            width={80}
            layout="fixed"
          />
        </div>
        <div className="flex-1 min-w-0 flex">
          <div className="mr-6">
            <div className="font-medium md:font-semibold w-full overflow-hidden whitespace-nowrap overflow-ellipsis min-w-0">
              {playerState.track}
            </div>
            <div className="text-sm overflow-hidden whitespace-nowrap overflow-ellipsis min-w-0">
              {playerState.artist}
            </div>
          </div>
          <button
            onClick={toggleFavorite}
            style={{ fill: playerState.isSaved ? "red" : undefined }}
          >
            {playerState.isSaved ? <HeartIcon /> : <UnfilledHeartIcon />}
          </button>
        </div>

        <button onClick={() => player.togglePlay()} className="md:hidden w-8 self-stretch flex items-center justify-center">
          {playerState.playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <ScrubberBar
        currentTime={currentTime}
        duration={playerState.duration}
        className="absolute md:hidden inset-x-2 bottom-0 h-1"
      />

      <div className="hidden md:flex flex-col items-center">
        <div className="mb-2">
          <button
            onClick={playPreviousTrack}
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            <PrevIcon />
          </button>
          <PlayButton
            isPlaying={playerState.playing}
            onClick={() => player.togglePlay()}
          />
          <button
            onClick={playNextTrack}
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            <NextIcon />
          </button>
        </div>

        <div className="flex w-full items-center gap-2">
          <div
            style={{ fontVariantNumeric: "tabular-nums" }}
            className="text-sm"
          >
            {formatTime(currentTime / 1000)}
          </div>
          <ScrubberBar
            currentTime={currentTime}
            duration={playerState.duration}
            className="relative h-5 w-full"
          />
          <div
            style={{ fontVariantNumeric: "tabular-nums" }}
            className="text-sm"
          >
            {formatTime(Number(playerState.duration) / 1000)}
          </div>
        </div>
      </div>
    </div>
  );
};
