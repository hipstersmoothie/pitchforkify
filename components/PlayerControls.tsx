import { useCallback, useContext, useEffect, useRef, useState } from "react";
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
import { ScrubberBar } from "./ScrubberBarProps";
import { VolumeIcon } from "./icons/VolumeIcon";

export const PlayerControls = () => {
  const volumeBeforeMute = useRef<number>(1);
  const spotifyApi = useSpotifyApi();
  const playAlbum = usePlayAlbum();
  const { reviews } = useContext(ReviewsContext);
  const { player } = useContext(PlayerContext);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
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

  // React to playback changes
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

  // Enable "Space" to toggle playback
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

  // Poll the player state every second
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

      player.getVolume().then(setVolume);
    }, 1000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    getAlbumFromOffset,
    playAlbum,
    player,
    playerState.duration,
    reviews,
    setVolume,
  ]);

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

        <button
          onClick={() => player.togglePlay()}
          className="md:hidden w-8 self-stretch flex items-center justify-center"
        >
          {playerState.playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <ScrubberBar
        value={currentTime}
        max={playerState.duration}
        onChange={(newTime) => player.seek(newTime)}
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
            value={currentTime}
            max={playerState.duration}
            onChange={(newTime) => player.seek(newTime)}
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

      <div className="flex items-center justify-end h-full w-full p-10">
        <button
          className="mr-2"
          onClick={() => {
            let newVolume = volumeBeforeMute.current;

            if (volume !== 0) {
              volumeBeforeMute.current = volume;
              newVolume = 0;
            }

            setVolume(newVolume);
            player.setVolume(newVolume);
          }}
        >
          <VolumeIcon volume={volume} />
        </button>
        <ScrubberBar
          max={1}
          value={volume}
          onChange={(newVolume) => {
            setVolume(newVolume);
            player.setVolume(newVolume);
          }}
          className="relative w-[100px] h-4"
        />
      </div>
    </div>
  );
};
