import { useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";

import { formatTime } from "../utils/formatTime";

import { PrevIcon } from "../components/icons/PrevIcon";
import { NextIcon } from "../components/icons/NextIcon";
import { UnfilledHeartIcon } from "../components/icons/UnfilledHeartIcon";
import { HeartIcon } from "../components/icons/HeartIcon";
import { usePlayAlbum, useSpotifyApi } from "../utils/useSpotifyApi";
import { PlayerContext } from "../utils/PlayerContext";
import { PlayButton } from "./PlayButton";
import { ReviewsContext } from "../utils/ReviewsContext";

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
    <div className="bg-white h-24 fixed left-0 right-0 bottom-0 grid gap-6 grid-cols-3 shadow-lg border-t items-center z-50">
      <div className="ml-2 flex items-center w-full">
        <div className="h-20 w-20 border mr-4 border-gray-300 hidden md:block">
          <Image
            src={playerState.cover}
            alt=""
            height={80}
            width={80}
            layout="fixed"
          />
        </div>
        <div className="min-w-0 mr-6">
          <div className="font-semibold w-full overflow-hidden whitespace-nowrap overflow-ellipsis min-w-0">
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

      <div className="flex flex-col items-center">
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
          <div
            className="relative w-full overflow-hidden"
            style={{ height: 20 }}
            onClick={(e) => {
              const percent =
                e.nativeEvent.offsetX /
                Number(
                  getComputedStyle(e.target as Element).width.replace("px", "")
                );

              player.seek(percent * playerState.duration);
            }}
          >
            <div
              style={{ height: 4 }}
              className="w-full absolute left-0 top-1/2 -translate-y-1/2 bg-gray-400"
            />
            <div
              style={{
                height: 4,
                left: `${(currentTime / playerState.duration - 1) * 100}%`,
              }}
              className="w-full bg-gray-700 absolute top-1/2 -translate-y-1/2"
            />
            <div
              style={{ height: 20 }}
              className="w-full absolute top-0 left-0 cursor-pointer"
            />
          </div>
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
