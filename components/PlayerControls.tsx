import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import makeClass from "clsx";
import { useDebouncedCallback } from "use-debounce";
import * as Collapsible from "@radix-ui/react-collapsible";
import { CaretDownIcon, CaretUpIcon } from "@radix-ui/react-icons";
import * as DismissableLayer from "@radix-ui/react-dismissable-layer";

import { formatTime } from "../utils/formatTime";

import { PrevIcon } from "../components/icons/PrevIcon";
import { NextIcon } from "../components/icons/NextIcon";
import { usePlayAlbum, useSpotifyApi } from "../utils/useSpotifyApi";
import { PlayerContext } from "../utils/PlayerContext";
import { PlayButton } from "./PlayButton";
import { ReviewsContext } from "../utils/context";
import { PauseIcon } from "./icons/PauseIcon";
import { PlayIcon } from "./icons/PlayIcon";
import { ScrubberBar } from "./ScrubberBar";
import { VolumeIcon } from "./icons/VolumeIcon";
import { HomeIcon } from "./icons/HomeIcon";
import { Tooltip } from "./Tooltip";
import { FavoriteButton } from "./FavoriteButton";
import { Review } from "../pages/api/reviews";

const getAlbumFromOffset = (
  reviews: Review[],
  currentUri: string,
  offset: number
) => {
  const currentReview = reviews.findIndex((r) => r.spotifyAlbum === currentUri);
  return reviews[currentReview + offset];
};

interface PlayerState {
  playing: boolean;
  album: string;
  artist: string;
  track: string;
  trackId: string;
  duration: number;
  cover: string;
  isSaved: boolean;
}

interface PlaybackStateContextShape {
  playerState: PlayerState;
  setPlayerState: (newState: PlayerState) => void;
}

const PlayerStateContext = createContext<PlaybackStateContextShape>({
  playerState: {
    playing: false,
    album: "",
    artist: "",
    track: "",
    trackId: "",
    duration: 0,
    cover: "",
    isSaved: false,
  },
  setPlayerState: () => undefined,
});

interface PlayerStateContextProviderProps {
  children: React.ReactNode;
}

export const PlayerStateContextProvider = ({
  children,
}: PlayerStateContextProviderProps) => {
  const { player } = useContext(PlayerContext);
  const spotifyApi = useSpotifyApi();
  const tryingToPlayNextAlbum = useRef(false);
  const { reviews } = useContext(ReviewsContext);
  const playAlbum = usePlayAlbum();
  const [playerState, setPlayerState] = useState({
    playing: false,
    album: "",
    artist: "",
    track: "",
    trackId: "",
    duration: 0,
    cover: "",
    isSaved: false,
  });

  useEffect(() => {
    if (!player) {
      return;
    }

    const playerStateChanged = async (newState: Spotify.PlaybackState) => {
      if (!newState) {
        return;
      }

      // If an album ends it will go to the first song and stop playing.
      // This code starts playing the next album when that happens
      if (
        newState.position === 0 &&
        newState.paused &&
        newState.track_window.next_tracks.length === 0
      ) {
        const nextAlbum = getAlbumFromOffset(reviews, playerState.album, 1);

        if (nextAlbum) {
          if (!tryingToPlayNextAlbum.current) {
            tryingToPlayNextAlbum.current = true;
            playAlbum(nextAlbum);
          }

          return;
        }
      }

      const trackId = newState.track_window.current_track.id;
      const {
        body: [isSaved],
      } = await spotifyApi.containsMySavedTracks([trackId]);

      tryingToPlayNextAlbum.current = false;

      setPlayerState({
        playing: !newState.paused,
        album: newState.track_window.current_track.album.uri,
        artist: newState.track_window.current_track.artists
          .map((a) => a.name)
          .join(", "),
        track: newState.track_window.current_track.name,
        trackId: newState.track_window.current_track.id,
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
  }, [playAlbum, player, playerState.album, reviews, spotifyApi]);

  return (
    <PlayerStateContext.Provider value={{ playerState, setPlayerState }}>
      {children}
    </PlayerStateContext.Provider>
  );
};

interface TrackSwitcherProps {
  toggleFavorite: (id: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TrackSwitcher = React.memo(function TrackSwitcher({
  toggleFavorite,
  open,
  setOpen,
}: TrackSwitcherProps) {
  const spotifyApi = useSpotifyApi();
  const { playerState } = useContext(PlayerStateContext);
  const [tracks, tracksSet] = useState<
    (SpotifyApi.TrackObjectSimplified & { isSaved: boolean })[]
  >([]);

  useEffect(() => {
    async function fetchTracks() {
      const tracksData = await spotifyApi.getAlbumTracks(
        playerState.album.replace("spotify:album:", ""),
        { limit: 50 }
      );
      const { body: savedData } = await spotifyApi.containsMySavedTracks(
        tracksData.body.items.map((i) => i.id)
      );

      tracksSet(
        tracksData.body.items.map((track, i) => {
          return {
            ...track,
            isSaved: savedData[i],
          };
        })
      );
    }

    fetchTracks();
  }, [playerState.album, spotifyApi]);

  return (
    <Collapsible.Root
      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center z-1 w-screen sm:w-full sm:max-w-3xl"
      open={open}
      onOpenChange={setOpen}
    >
      <Tooltip message={open ? "Hide Track List" : "Show Track List"}>
        <Collapsible.Trigger
          id="track-list-toggle"
          className="bg-white border border-b-0 border-gray-300 px-4 py-1 rounded-t-xl focus:outline-none keyboard-focus:shadow-focus"
        >
          {open ? <CaretDownIcon /> : <CaretUpIcon />}
        </Collapsible.Trigger>
      </Tooltip>
      <Collapsible.Content
        className="collapsible bg-white border  bottom-0 border-gray-300 rounded-t-xl overflow-auto max-h-96"
        style={{ width: "calc(100% - 0.5rem)" }}
      >
        <DismissableLayer.DismissableLayer
          onInteractOutside={() => setOpen(false)}
          onEscapeKeyDown={() => setOpen(false)}
        >
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="rows group flex items-center hover:bg-gray-200 cursor-pointer focus:outline-none keyboard-focus:shadow-focus-inner keyboard-focus:rounded-lg"
              aria-label={`Play ${track.name}`}
              tabIndex={0}
              onClick={async () => {
                if (playerState.playing && playerState.trackId === track.id) {
                  spotifyApi.pause();
                } else {
                  await spotifyApi.play({
                    uris: tracks.slice(index).map((t) => t.uri),
                  });
                }
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "ArrowDown" &&
                  document.activeElement.nextSibling
                ) {
                  e.stopPropagation();
                  e.preventDefault();
                  (document.activeElement.nextSibling as HTMLElement).focus();
                } else if (
                  e.key === "ArrowUp" &&
                  document.activeElement.previousSibling
                ) {
                  e.stopPropagation();
                  e.preventDefault();
                  (
                    document.activeElement.previousSibling as HTMLElement
                  ).focus();
                }
                if (e.key === " " || e.key === "Enter") {
                  spotifyApi.play({ uris: [track.uri] });
                }
              }}
            >
              <div className="py-2 px-4 flex items-center justify-center text-right w-12">
                {playerState.playing && playerState.trackId === track.id ? (
                  <PauseIcon className="fill-current text-gray-800" />
                ) : (
                  <>
                    <span className="group-hover:hidden text-gray-500">
                      {index + 1}
                    </span>
                    <PlayIcon className="hidden group-hover:block fill-current text-gray-800" />
                  </>
                )}
              </div>
              <div className="p-2 flex-1">{track.name}</div>
              <div
                className={makeClass(
                  "py-2 px-1",
                  track.isSaved
                    ? "block"
                    : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                )}
              >
                <FavoriteButton
                  isSaved={track.isSaved}
                  className="p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track.id);
                    tracksSet(
                      tracks.map((t, i) => {
                        return {
                          ...t,
                          isSaved:
                            t.id === track.id ? !track.isSaved : t.isSaved,
                        };
                      })
                    );
                  }}
                />
              </div>
              <div className="py-2 px-4 text-gray-500">
                {formatTime(track.duration_ms / 1000)}
              </div>
            </div>
          ))}
        </DismissableLayer.DismissableLayer>
      </Collapsible.Content>
    </Collapsible.Root>
  );
});

export const PlayerControls = () => {
  const volumeBeforeMute = useRef<number>(1);
  const timeUpdateIntervale = useRef<ReturnType<typeof setInterval>>();
  const spotifyApi = useSpotifyApi();
  const playAlbum = usePlayAlbum();
  const { reviews } = useContext(ReviewsContext);
  const { player } = useContext(PlayerContext);
  const debouncedSeek = useDebouncedCallback((v) => player?.seek(v), 200);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const { playerState, setPlayerState } = useContext(PlayerStateContext);
  const [open, setOpen] = useState(false);

  // Enable "Space" to toggle playback
  useEffect(() => {
    function pressSpace(e: KeyboardEvent) {
      if (e.key === " " && playerState.track) {
        player.togglePlay();
        e.preventDefault();
      }
    }

    document.addEventListener("keydown", pressSpace);
    setCurrentTime(0);

    return () => {
      document.removeEventListener("keydown", pressSpace);
    };
  }, [playerState.track, player]);

  // Poll the player state every second
  useEffect(() => {
    timeUpdateIntervale.current = setInterval(() => {
      if (!player) {
        return;
      }

      player.getCurrentState().then((s) => {
        if (!s) {
          return;
        }

        if (s.position <= playerState.duration) {
          setCurrentTime(s.position);
        }
      });

      player.getVolume().then(setVolume);
    }, 1000);

    return () => {
      if (timeUpdateIntervale.current) {
        clearInterval(timeUpdateIntervale.current);
      }
    };
  }, [
    playAlbum,
    player,
    playerState.duration,
    reviews,
    setVolume,
    currentTime,
  ]);

  const playPreviousTrack = useCallback(() => {
    player.getCurrentState().then((s) => {
      if (s?.track_window.previous_tracks.length === 0) {
        const prevAlbum = getAlbumFromOffset(reviews, s.context.uri, -1);

        if (prevAlbum) {
          playAlbum(prevAlbum);
        }
      } else {
        player.previousTrack();
      }
    });
  }, [reviews, playAlbum, player]);

  const playNextTrack = useCallback(() => {
    player.getCurrentState().then((s) => {
      if (s?.track_window.next_tracks.length === 0) {
        const nextAlbum = getAlbumFromOffset(reviews, s.context.uri, 1);

        if (nextAlbum) {
          playAlbum(nextAlbum);
        }
      } else {
        player.nextTrack();
      }
    });
  }, [reviews, playAlbum, player]);

  const toggleFavorite = useCallback(
    async (trackId: string) => {
      const {
        body: [isSaved],
      } = await spotifyApi.containsMySavedTracks([trackId]);

      if (isSaved) {
        await spotifyApi.removeFromMySavedTracks([trackId]);
      } else {
        await spotifyApi.addToMySavedTracks([trackId]);
      }

      if (trackId === playerState.trackId) {
        setPlayerState({ ...playerState, isSaved: !isSaved });
      }
    },
    [playerState, setPlayerState, spotifyApi]
  );

  if (!playerState.track) {
    return null;
  }

  return (
    <div
      className={makeClass(
        "bg-white h-16 m-1 rounded-md border border-gray-300 shadow-xl fixed left-0 right-0 bottom-0 grid gap-6 border-t items-center z-50",
        open && "rounded-t-none",
        "md:grid-cols-3 md:h-24 md:m-0 md:rounded-none"
      )}
    >
      <TrackSwitcher
        toggleFavorite={toggleFavorite}
        open={open}
        setOpen={setOpen}
      />
      <div className={"mx-2 flex items-center border-box my-1 md:my-0"}>
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
        <div className="flex-1 min-w-0 flex items-center">
          <div className="mr-6">
            <div className="font-medium md:font-semibold w-full overflow-hidden whitespace-nowrap overflow-ellipsis min-w-0">
              {playerState.track}
            </div>
            <div className="text-sm overflow-hidden whitespace-nowrap overflow-ellipsis min-w-0">
              {playerState.artist}
            </div>
          </div>
          <FavoriteButton
            isSaved={playerState.isSaved}
            className="p-1"
            onClick={() => toggleFavorite(playerState.trackId)}
          />
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
        onChange={(newTime) => {
          setCurrentTime(newTime);
          debouncedSeek(newTime);
        }}
        className="absolute md:hidden inset-x-2 bottom-0 h-1"
      />

      <div className="hidden md:flex flex-col items-center">
        <div className="mb-2">
          <Tooltip message="Prev">
            <button
              onClick={playPreviousTrack}
              className="text-gray-600 hover:text-gray-800 m-2 focus:outline-none keyboard-focus:shadow-focus rounded-full"
            >
              <PrevIcon />
            </button>
          </Tooltip>
          <Tooltip message={playerState.playing ? "Pause" : "Play"}>
            <PlayButton
              isPlaying={playerState.playing}
              onClick={() => player.togglePlay()}
            />
          </Tooltip>
          <Tooltip message="Next">
            <button
              onClick={playNextTrack}
              className="text-gray-600 hover:text-gray-800 m-2 focus:outline-none keyboard-focus:shadow-focus rounded-full"
            >
              <NextIcon />
            </button>
          </Tooltip>
        </div>

        <div className="flex w-full items-center gap-2">
          <div
            style={{ fontVariantNumeric: "tabular-nums" }}
            className="text-sm"
          >
            {formatTime(currentTime / 1000)}
          </div>
          <ScrubberBar
            className="relative h-5 w-full"
            value={currentTime}
            max={playerState.duration}
            onChange={(newTime) => {
              if (timeUpdateIntervale.current) {
                clearInterval(timeUpdateIntervale.current);
              }

              setCurrentTime(newTime);
              debouncedSeek(newTime);
            }}
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
        <Tooltip message="Open in Spotify">
          <button
            className="mr-4 focus:outline-none keyboard-focus:shadow-focus rounded"
            onClick={() =>
              window.open(
                `https://open.spotify.com/album/${playerState.album.replace(
                  "spotify:album:",
                  ""
                )}?si=kKI9SkC6TMyQ9Ks9GRvn0w`
              )
            }
          >
            <HomeIcon />
          </button>
        </Tooltip>
        <div className="flex items-center">
          <Tooltip message={volume === 0 ? "Unmute" : "Mute"}>
            <button
              className="mr-2 focus:outline-none keyboard-focus:shadow-focus rounded"
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
          </Tooltip>
          <ScrubberBar
            max={100}
            value={volume * 100}
            onChange={(newVolume) => {
              setVolume(newVolume / 100);
              player.setVolume(newVolume / 100);
            }}
            className="relative w-[100px] h-4"
          />
        </div>
      </div>
    </div>
  );
};
