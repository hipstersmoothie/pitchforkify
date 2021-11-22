import * as Dialog from "@radix-ui/react-dialog";
import getYear from "date-fns/getYear";
import format from "date-fns/format";
import Image from "next/image";
import makeClass from "clsx";

import { CloseIcon } from "./icons/CloseIcon";
import { LoadingLogoIcon } from "./icons/LoadingLogo";
import { Review } from "../pages/api/reviews";

import { usePlayAlbum } from "../utils/useSpotifyApi";
import { PlayButton } from "../components/PlayButton";
import useIntersectionObserver from "../utils/useIntersectionObserver";
import { useRouter } from "next/dist/client/router";
import { useInfiniteQuery } from "react-query";
import { useRef } from "react";
import { Score } from "./Score";

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
          <Score score={review.score} isBestNew={review.isBestNew} />
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

            <div className="flex items-center mx-8 mb-4 md:mb-12 gap-6 md:gap-10 justify-center">
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
                score={review.score}
                isBestNew={review.isBestNew}
                className="border-white"
              />
            </div>
          </div>
        </Dialog.Title>
        <Dialog.Description
          className="mx-auto w-[fit-content] px-3"
          dangerouslySetInnerHTML={{ __html: review.reviewHtml }}
        />
        <Dialog.Close asChild>
          <button className="fixed top-0 right-0 p-6 text-gray-400 hover:text-white">
            <CloseIcon />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export interface ReviewGridProps {
  reviews: Review[];
  page: number;
  endpoint: "favorites" | "reviews";
  body?: string;
}

export const ReviewGrid = ({
  reviews,
  page,
  endpoint,
  body,
}: ReviewGridProps) => {
  const bottomRef = useRef<HTMLDivElement>();
  const router = useRouter();
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery(
      endpoint,
      async ({
        pageParam,
      }: {
        pageParam?: { page: number; cursor?: number };
      }) => {
        const res = await fetch(
          `/api/${endpoint}?${
            pageParam.cursor
              ? `cursor=${pageParam.cursor}`
              : `page=${pageParam.page}`
          }`,
          { method: "POST", body }
        );
        const data = await res.json();
        router.replace(
          `/${endpoint === "favorites" ? "profile" : ""}?page=${
            pageParam.page
          }`,
          undefined,
          {
            shallow: true,
            scroll: false,
          }
        );
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
          if (!reviews[reviews.length - 1]) {
            return false;
          }

          return {
            page: pageParam.page + 1,
            cursor: reviews[reviews.length - 1].id,
          };
        },
      }
    );

  useIntersectionObserver({
    target: bottomRef,
    onIntersect: fetchNextPage,
    enabled: hasNextPage,
    rootMargin: "50%",
  });

  return (
    <div className="pt-10 pb-32">
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6 max-w-6xl mx-auto px-2 sm:px-8">
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
    </div>
  );
};
