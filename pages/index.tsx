import { useSession, signIn } from "next-auth/client";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image";
import makeClass from "clsx";
import { useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import getYear from "date-fns/getYear";
import format from "date-fns/format";
import { useInfiniteQuery } from "react-query";

import { CloseIcon } from "../components/icons/CloseIcon";
import { BestNewBadge } from "../components/icons/BestNewBadge";

import { getReviews, Review } from "./api/reviews";
import useIntersectionObserver from "../utils/useIntersectionObserver";
import { LoadingLogoIcon } from "../components/icons/LoadingLogo";
import { useRouter } from "next/dist/client/router";
import { usePlayAlbum } from "../utils/useSpotifyApi";
import { PlayButton } from "../components/PlayButton";
import { ReviewsContext } from "../utils/ReviewsContext";

interface ArtistListProps extends React.ComponentProps<"ul"> {
  review: Review;
}

const ArtistList = ({ review, ...props }: ArtistListProps) => {
  return (
    <ul {...props}>
      {review.artists.map((artist) => (
        <li
          className="after:content-['/'] last:after:content-[''] after:px-1 last:after:px-0"
          key={`${artist.id}-${review.id}`}
        >
          {artist.name}
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
          key={`${label.id}-${review.id}`}
        >
          {label.name}
        </li>
      ))}
    </ul>
  );
};

interface ScoreProps extends React.ComponentProps<"div"> {
  review: Review;
  isBig?: boolean;
}

const Score = ({ review, className, isBig, ...props }: ScoreProps) => {
  return (
    <div className="flex items-center flex-col gap-6">
      {review.isBestNew && isBig && <BestNewBadge />}
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
                key={`${genre.id}-${review.id}`}
              >
                {genre.name}
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

interface HomeProps {
  reviews: Review[];
  page: number;
}

export default function Home({ reviews, page }: HomeProps) {
  const [session] = useSession();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>();
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery(
      "reviews",
      async ({
        pageParam,
      }: {
        pageParam?: { page: number; cursor?: number };
      }) => {
        const res = await fetch(
          `/api/reviews?${
            pageParam.cursor
              ? `cursor=${pageParam.cursor}`
              : `page=${pageParam.page}`
          }`
        );
        const data = await res.json();
        router.query.page = String(pageParam.page);
        router.push(router, undefined, {
          scroll: false,
        });
        return { pageParam, reviews: data as Review[] };
      },
      {
        initialData: {
          pages: [
            {
              pageParam: { page },
              reviews: reviews,
            },
          ],
          pageParams: [{ page }],
        },
        getNextPageParam: ({ pageParam, reviews }) => {
          return {
            page: pageParam.page + 1,
            cursor: reviews[reviews.length - 1].id,
          };
        },
      }
    );

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn();
    }
  }, [session]);

  useIntersectionObserver({
    target: bottomRef,
    onIntersect: fetchNextPage,
    enabled: hasNextPage,
    rootMargin: "50%",
  });

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

      <main className="pt-10 pb-32">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto px-8">
          {data.pages.map((page) =>
            page.reviews.map((review) => (
              <ReviewComponent key={review.albumTitle} {...review} />
            ))
          )}
        </ul>

        <div
          ref={bottomRef}
          className="flex items-center w-full text-center justify-center"
        >
          <span className=" text-xl my-12 font-medium">
            {isFetchingNextPage && <LoadingLogoIcon />}
          </span>
        </div>
      </main>

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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const page = context.query.page ? Number(context.query.page) : 1;
  const reviews = await getReviews({ page });

  return {
    props: { reviews, page },
  };
};
