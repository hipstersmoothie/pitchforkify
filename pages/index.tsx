import { useSession, signIn } from "next-auth/client";
import Head from "next/head";
import Image from "next/image";
import makeClass from "clsx";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SpotifyWebApi from "spotify-web-api-node";
import * as Dialog from "@radix-ui/react-dialog";
import getYear from "date-fns/getYear";
import format from "date-fns/format";

import { Header } from "../components/Header";
import { formatTime } from "../utils/formatTime";
import { PlayIcon } from "../components/icons/PlayIcon";
import { PauseIcon } from "../components/icons/PauseIcon";
import { PrevIcon } from "../components/icons/PrevIcon";
import { NextIcon } from "../components/icons/NextIcon";
import { CloseIcon } from "../components/icons/CloseIcon";
import { BestNewBadge } from "../components/icons/BestNewBadge";
import { UnfilledHeartIcon } from "../components/icons/UnfilledHeartIcon";
import { HeartIcon } from "../components/icons/HeartIcon";
import { getReviews, Review } from "./api/reviews";

const DEVICE_NAME = "pitchforkify";

const PlayerContext =
  createContext<{ player: Spotify.Player; playerId: string }>(undefined);

const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
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

const ReviewsContext = createContext<{ reviews: Review[] }>({ reviews: [] });

interface PlayButtonProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  isPlaying: boolean;
}

const PlayButton = ({ isPlaying, className, ...props }: PlayButtonProps) => {
  return (
    <button
      aria-label={isPlaying ? "pause" : "play"}
      className={makeClass(
        className,
        "bg-gray-800 text-white p-3 rounded-full cursor-pointer hover:scale-[1.1]"
      )}
      {...props}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
};

interface ArtistListProps extends React.ComponentProps<"ul"> {
  review: Review;
}

const ArtistList = ({ review, ...props }: ArtistListProps) => {
  return (
    <ul {...props}>
      {review.artists.map((artist) => (
        <li
          className="after:content-['/'] last:after:content-[''] after:px-1 last:after:px-0"
          key={`${review.albumTitle}-${artist}`}
        >
          {artist.artist.name}
        </li>
      ))}
    </ul>
  );
};

interface LabelListProps extends React.ComponentProps<"ul"> {
  review: Review;
}

const LabelList = ({ review, className, ...props }: LabelListProps) => {
  return (
    <ul {...props} className={makeClass(className, "flex")}>
      {review.labels.map((label) => (
        <li
          className="after:content-['/'] last:after:content-[''] after:px-1 last:after:px-0"
          key={`${review.albumTitle}-${label}`}
        >
          {label.label.name}
        </li>
      ))}
    </ul>
  );
};

interface ScoreProps extends React.ComponentProps<"div"> {
  review: Review;
  isBig?: boolean;
}

const Score = ({ review, className, ...props }: ScoreProps) => {
  return (
    <div className="flex items-center flex-col gap-6">
      {review.isBestNew && <BestNewBadge />}
      <div
        className={makeClass(
          className,
          "font-extrabold border-4 border-gray-800 rounded-full p-2 mb-3",
          review.isBestNew && "text-[#ff3530] border-[#ff3530]"
        )}
        {...props}
      >
        {review.score.toFixed(1)}
      </div>
    </div>
  );
};

const useSpotifyApi = () => {
  const [session] = useSession();
  const spotifyApi = useMemo(
    () =>
      new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        ...session,
      }),
    [session]
  );

  return spotifyApi;
};

const usePlayAlbum = () => {
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

interface AlbumCoverProps extends React.ComponentProps<"div"> {
  review: Review;
}

const AlbumCover = ({ className, review, ...props }: AlbumCoverProps) => {
  const playAlbum = usePlayAlbum();

  return (
    <div
      className={makeClass(
        className,
        "w-full border border-gray-200 relative group"
      )}
      {...props}
    >
      <Image
        src={review.cover}
        height={300}
        width={300}
        alt=""
        layout="responsive"
      />
      <PlayButton
        isPlaying={false}
        className="absolute top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2  opacity-0 group-hover:block group-hover:opacity-100 transition-opacity"
        aria-label={`Play ${review.albumTitle}`}
        onClick={(e) => {
          e.stopPropagation();
          playAlbum(review);
        }}
      />
    </div>
  );
};

const ReviewComponent = (review: Review) => {
  return (
    <Dialog.Root modal={true}>
      <Dialog.Trigger
        className="flex"
        asChild
        style={{ WebkitAppearance: "none" }}
      >
        <li className="mb-10 flex flex-col items-center text-center cursor-pointer">
          <AlbumCover
            review={review}
            className={makeClass("mb-4", review.isBestNew && "bestNew")}
          />
          <Score review={review} />
          <ArtistList className="font-bold text-lg mb-1" review={review} />

          <h2 className="italic text-gray-700 mb-3">{review.albumTitle}</h2>

          <ul className="text-xs font-bold uppercase flex mb-1">
            {review.genres.map((genre) => (
              <li
                className="after:content-['/'] last:after:content-[''] after:px-1 last:after:px-0"
                key={`${review.albumTitle}-${genre}`}
              >
                {genre.genre.name}
              </li>
            ))}
          </ul>
          <LabelList
            review={review}
            className="text-xs text-gray-600 font-semibold mb-1"
          />

          <time className="text-xs text-gray-400 uppercase font-semibold">
            {format(new Date(review.publishDate), "LLLL dd yyyy")}
          </time>
        </li>
      </Dialog.Trigger>
      <Dialog.Overlay className="bg-[rgba(34,34,34,.98)] fixed inset-0" />
      <Dialog.Content className="fixed text-white h-screen overflow-auto mx-auto w-full">
        <Dialog.Title asChild className="text-center mt-6 mb-2">
          <div>
            <ArtistList review={review} className="text-2xl mb-2" />
            <h2 className="font-semibold italic text-2xl mb-10">
              {review.albumTitle}
            </h2>

            <div className="flex items-center mx-8 mb-12 gap-6 md:gap-10 justify-center">
              <div className="w-full max-h-[300px] max-w-[300px]">
                <AlbumCover review={review} className="mb-2 border-gray-800" />
                <div className="flex items-center gap-1 text-gray-300 text-xs uppercase">
                  <LabelList review={review} />
                  <span>{" • "}</span>
                  <span>{getYear(new Date(review.publishDate))}</span>
                </div>
              </div>
              <Score
                isBig
                review={review}
                className="text-5xl border-[6px] w-28 h-28 border-white flex items-center justify-center"
              />
            </div>
          </div>
        </Dialog.Title>
        <Dialog.Description
          className="mx-auto w-[fit-content]"
          dangerouslySetInnerHTML={{ __html: review.reviewHtml }}
        />
        <Dialog.Close>
          <button className="fixed top-0 right-0 p-6 text-gray-400 hover:text-white">
            <CloseIcon />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};

const PlayerControls = () => {
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
  }, [player]);

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
    <div className="bg-white h-24 fixed left-0 right-0 bottom-0 grid gap-6 grid-cols-3 shadow-lg border-t items-center">
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

interface HomeProps {
  reviews: Review[];
}

export default function Home({ reviews }: HomeProps) {
  const [session] = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn();
    }
  }, [session]);

  return (
    <div className="">
      <Head>
        <title>pitchforkify</title>
        <meta
          name="description"
          content="Easily browse and listen to pitchfork album reviews"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <ReviewsContext.Provider value={{ reviews }}>
        <PlayerProvider>
          <main className="pt-10 pb-32">
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto px-8">
              {reviews.map((review) => (
                <ReviewComponent key={review.albumTitle} {...review} />
              ))}
            </ul>

            <PlayerControls />
          </main>
        </PlayerProvider>
      </ReviewsContext.Provider>

      {/* <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer> */}
    </div>
  );
}

export async function getStaticProps() {
  const reviews = await getReviews();

  return {
    props: {
      reviews,
    },
    revalidate: 60 * 60 * 24,
  };
}
