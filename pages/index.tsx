import { useSession, signIn } from "next-auth/client";
import Head from "next/head";
import Image from "next/image";
import makeClass from "clsx";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import * as Dialog from "@radix-ui/react-dialog";
import getYear from "date-fns/getYear";
import format from "date-fns/format";

import { Header } from "../components/Header";
import { Review, scrapeReviews } from "./api/scrape-pitchfork";
import { formatTime } from "../utils/formatTime";
import { PlayIcon } from "../components/icons/PlayIcon";
import { PauseIcon } from "../components/icons/PauseIcon";
import { PrevIcon } from "../components/icons/PrevIcon";
import { NextIcon } from "../components/icons/NextIcon";
import { CloseIcon } from "../components/icons/CloseIcon";
import { BestNewBadge } from "../components/icons/BestNewBadge";

const DEVICE_NAME = "pitchforkify";

const PlayerContext =
  createContext<{ player: Spotify.Player; playerId }>(undefined);

const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [session] = useSession();
  const [playerId, playerIdSet] = useState<string>();
  const player = useRef<Spotify.Player>();

  useEffect(() => {
    if (!session || player.current) {
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
          cb((session as any).accessToken);
        },
      });

      player.current.addListener("ready", ({ device_id, ...rest }) => {
        console.log("player ready");
        playerIdSet(device_id);
      });

      player.current.connect();
    };
  }, [session?.accessToken]);

  return (
    <PlayerContext.Provider value={{ player: player.current, playerId }}>
      {children}
    </PlayerContext.Provider>
  );
};

const usePlayer = () => {
  return useContext(PlayerContext);
};

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
          {artist}
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
          {label}
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
        {review.score}
      </div>
    </div>
  );
};

interface AlbumCoverProps extends React.ComponentProps<"div"> {
  review: Review;
}

const AlbumCover = ({ className, review, ...props }: AlbumCoverProps) => {
  const [session] = useSession();
  const { playerId, player } = usePlayer();

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    ...session,
  });

  return (
    <div
      className={makeClass(
        className,
        "w-full border border-gray-200 relative group"
      )}
      {...props}
    >
      <img src={review.cover} className="w-full" alt="" />
      <PlayButton
        isPlaying={false}
        className="absolute top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2  opacity-0 group-hover:block group-hover:opacity-100 transition-opacity"
        aria-label={`Play ${review.albumTitle}`}
        onClick={async (e) => {
          e.stopPropagation();

          if (!session) {
            return signIn();
          }

          const {
            body: { devices },
          } = await spotifyApi.getMyDevices();
          const appPlayer = devices.find((d) => d.name !== DEVICE_NAME);
          const device_id = playerId || appPlayer.id;

          spotifyApi
            .play({
              context_uri: review.spotifyAlbum.uri,
              device_id,
            })
            .then(() => {
              // @ts-ignore
              player.activateElement();
            });
        }}
      />
    </div>
  );
};

const ReviewComponent = (review: Review) => {
  const [session] = useSession();
  const { playerId, player } = usePlayer();

  return (
    <Dialog.Root modal={true}>
      <Dialog.Trigger
        className="flex"
        asChild
        // @ts-ignore
        style={{ "-webkit-appearance": "none" }}
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
                {genre}
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
        <Dialog.Title className="text-center mt-6 mb-2">
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
        </Dialog.Title>
        <Dialog.Description
          className="mx-auto max-w-[80ch]"
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
  const { player } = usePlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [playerState, playerStateSet] = useState({
    playing: false,
    artist: "",
    track: "",
    duration: 0,
    cover: "",
  });

  useEffect(() => {
    if (!player) {
      return;
    }

    const playerStateChanged = (newState: Spotify.PlaybackState) => {
      if (!newState) {
        return;
      }

      setCurrentTime(newState.position);
      playerStateSet({
        playing: !newState.paused,
        artist: newState.track_window.current_track.artists
          .map((a) => a.name)
          .join(", "),
        track: newState.track_window.current_track.name,
        duration: newState.duration,
        cover: newState.track_window.current_track.album.images[1].url,
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
    const interval = setInterval(() => {
      if (!player) {
        return;
      }

      player.getCurrentState().then((s) => {
        if (!s) {
          return;
        }

        setCurrentTime(s.position);
      });
    }, 1000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [player]);

  if (!playerState.track) {
    return null;
  }

  return (
    <div className="bg-white h-24 fixed left-0 right-0 bottom-0 grid gap-2 grid-cols-3 shadow-lg border-t items-center">
      <div className="flex items-center gap-2 w-full">
        <img
          src={playerState.cover}
          alt=""
          className="h-20 ml-2 border border-gray-300"
        />
        <div className="w-full grid grid-cols-[1fr, auto]">
          <div className="font-semibold w-full overflow-hidden whitespace-nowrap overflow-ellipsis min-w-0">
            {playerState.track}
          </div>
          <div className="text-sm overflow-hidden whitespace-nowrap overflow-ellipsis min-w-0">
            {playerState.artist}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="mb-2">
          <button
            onClick={() => player.previousTrack()}
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            <PrevIcon />
          </button>
          <PlayButton
            isPlaying={playerState.playing}
            onClick={() => player.togglePlay()}
          />
          <button
            onClick={() => player.nextTrack()}
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
  const reviews = await scrapeReviews(1);

  return {
    props: {
      reviews,
    },
    revalidate: 60 * 60 * 24,
  };
}
