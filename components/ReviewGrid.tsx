/* eslint-disable jsx-a11y/role-supports-aria-props */
import * as Dialog from "@radix-ui/react-dialog";
import getYear from "date-fns/getYear";
import format from "date-fns/format";
import Image from "next/image";
import makeClass from "clsx";
import FastAverageColor from "fast-average-color";
import contrast from "contrast";
import { useKeyboardNavigation } from "@design-systems/hooks";

import { CloseIcon } from "./icons/CloseIcon";
import { LoadingLogoIcon } from "./icons/LoadingLogo";
import { Review } from "../pages/api/reviews";

import { usePlayAlbum, useSpotifyApi } from "../utils/useSpotifyApi";
import { PlayButton } from "../components/PlayButton";
import useIntersectionObserver from "../utils/useIntersectionObserver";
import { useRouter } from "next/router";
import { useInfiniteQuery, useQuery } from "react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Score } from "./Score";
import { Tooltip } from "./Tooltip";
import { FavoriteButton } from "./FavoriteButton";
import { GridFilters } from "./GridFilter";
import { PAGE_SIZE } from "../utils/constants";
import { ReviewsContext } from "../utils/context";

const averageColor = new FastAverageColor();

const FavoritesContext = createContext<{ favorites: string[] }>({
  favorites: [],
});

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
  const wrapperRef = useRef<HTMLDivElement>();
  const playAlbum = usePlayAlbum();
  const spotifyApi = useSpotifyApi();
  const { favorites } = useContext(FavoritesContext);
  const isSavedOnDb = favorites.includes(review.spotifyAlbum);
  const [isSaved, setIsSaved] = useState(isSavedOnDb);
  const [isDarkImage, isDarkImageSet] = useState(false);

  useEffect(() => {
    setIsSaved(isSavedOnDb);
  }, [isSavedOnDb]);

  useEffect(() => {
    const img = wrapperRef.current.querySelector("img");

    async function determineBackgroundColor() {
      const color = await averageColor.getColorAsync(
        wrapperRef.current.querySelector("img"),
        {
          top: 0,
          left: 0,
          width: 40,
          height: 40,
        }
      );

      isDarkImageSet(contrast(color.hex) === "dark");
    }

    img.addEventListener("load", determineBackgroundColor);

    return () => {
      img.removeEventListener("load", determineBackgroundColor);
    };
  }, []);

  const toggleFavorite = useCallback(async () => {
    const newIsSaved = !isSaved;
    const id = review.spotifyAlbum.replace("spotify:album:", "");

    // Update local state
    setIsSaved(newIsSaved);

    // Update on Spotify
    if (isSaved) {
      await spotifyApi.removeFromMySavedAlbums([id]);
      await fetch("/api/favorites", {
        method: "DELETE",
        body: JSON.stringify({ uri: review.spotifyAlbum }),
      });
    } else {
      await spotifyApi.addToMySavedAlbums([id]);
      await fetch("/api/favorites", {
        method: "PUT",
        body: JSON.stringify({ uri: review.spotifyAlbum }),
      });
    }
  }, [isSaved, review.spotifyAlbum, spotifyApi]);

  return (
    <div
      ref={wrapperRef}
      className={makeClass(
        className,
        "w-full border border-gray-200 relative group"
      )}
      {...props}
    >
      <Image
        src={review.cover.replace("_160", "_400")}
        height={300}
        width={300}
        alt=""
        layout="responsive"
      />
      <FavoriteButton
        className={makeClass(
          "absolute top-4 left-4 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
          isSaved && "opacity-100"
        )}
        fill={isDarkImage ? "white" : "black"}
        isSaved={isSaved}
        size={24}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite();
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.stopPropagation();
            e.preventDefault();
            toggleFavorite();
          }
        }}
      />
      {review.spotifyAlbum && (
        <PlayButton
          isPlaying={false}
          className="absolute top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label={`Play ${review.albumTitle}`}
          onClick={(e) => {
            e.stopPropagation();
            playAlbum(review);
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.stopPropagation();
              e.preventDefault();
              playAlbum(review);
            }
          }}
        />
      )}
    </div>
  );
};

const ReviewComponent = (review: Review & { index: number }) => {
  const isKeyboardNav = useKeyboardNavigation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root modal={true} open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="flex"
        asChild
        style={{ WebkitAppearance: "none" }}
      >
        <article
          className="review-item mb-6 md:mb-10 flex flex-col items-center text-center cursor-pointer focus:outline-none keyboard-focus:shadow-focus rounded"
          aria-posinset={review.index}
          tabIndex={0}
          aria-label={`Open Review for ${review.albumTitle}`}
          onKeyDown={(e) => {
            const trackListToggle =
              document.querySelector<HTMLElement>("#track-list-toggle");
            const gridFilter =
              document.querySelector<HTMLElement>("#grid-filter");

            if (
              (e.key === "ArrowRight" || e.key === "PageDown") &&
              document.activeElement.nextSibling
            ) {
              e.stopPropagation();
              e.preventDefault();
              (document.activeElement.nextSibling as HTMLElement).focus();
            } else if (
              (e.key === "ArrowUp" || (e.key === "Home" && e.ctrlKey)) &&
              gridFilter
            ) {
              e.stopPropagation();
              e.preventDefault();
              gridFilter.focus();
            } else if (
              (e.key === "ArrowDown" || (e.key === "End" && e.ctrlKey)) &&
              trackListToggle
            ) {
              e.stopPropagation();
              e.preventDefault();
              trackListToggle.focus();
            } else if (
              (e.key === "ArrowLeft" || e.key === "PageUp") &&
              document.activeElement.previousSibling
            ) {
              e.stopPropagation();
              e.preventDefault();
              (document.activeElement.previousSibling as HTMLElement).focus();
            } else if (e.key === " " || e.key === "Enter") {
              setOpen(true);
              e.stopPropagation();
              e.preventDefault();
            }
          }}
        >
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
        </article>
      </Dialog.Trigger>
      <Dialog.Overlay className="bg-[rgba(34,34,34,.98)] fixed inset-0" />
      <Dialog.Content
        className="fixed text-white h-screen overflow-auto mx-auto w-full pb-12"
        onOpenAutoFocus={(e) => {
          if (!isKeyboardNav) {
            e.preventDefault();
          }
        }}
      >
        <Tooltip message="Close Review">
          <Dialog.Close asChild>
            <button className="fixed top-0 right-0 p-3 m-3 text-gray-400 hover:text-white focus:outline-none keyboard-focus:shadow-focus-tight rounded">
              <CloseIcon />
            </button>
          </Dialog.Close>
        </Tooltip>
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
      </Dialog.Content>
    </Dialog.Root>
  );
};

export interface ReviewGridProps {
  reviews: Review[];
  page: number;
  endpoint: "favorite-reviews" | "reviews";
  filters?: GridFilters;
}

export const ReviewGrid = ({
  reviews,
  page,
  endpoint,
  filters,
}: ReviewGridProps) => {
  const firstRender = useRef(true);
  const bottomRef = useRef<HTMLDivElement>();
  const { setAllReviews } = useContext(ReviewsContext);
  const router = useRouter();

  const { data: favorites } = useQuery("/api/favorites", async () => {
    const req = await fetch("/api/favorites");
    return req.json() as Promise<string[]>;
  });

  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
    remove,
  } = useInfiniteQuery(
    endpoint,
    async ({
      pageParam,
    }: {
      pageParam?: { page: number; cursor?: number };
    }) => {
      const params = new URLSearchParams();

      if (pageParam.cursor) {
        params.set("cursor", String(pageParam.cursor));
      } else {
        params.set("page", String(pageParam.page));
      }

      if (filters?.genre.length) {
        params.set("genre", encodeURIComponent(filters.genre.join(",")));
      }

      if (filters?.isBestNew) {
        params.set("isBestNew", "1");
      }

      if (filters?.yearRange) {
        params.set("yearStart", String(filters.yearRange.start));
        params.set("yearEnd", String(filters.yearRange.end));
      }

      if (filters?.score) {
        params.set("scoreStart", String(filters.score.start));
        params.set("scoreEnd", String(filters.score.end));
      }

      if (filters?.search) {
        const artists = filters.search
          .filter((i) => i.type === "artist")
          .map((i) => i.id);
        const labels = filters.search
          .filter((i) => i.type === "label")
          .map((i) => i.id);

        if (artists.length) {
          params.set("artists", encodeURIComponent(artists.join(",")));
        }

        if (labels.length) {
          params.set("labels", encodeURIComponent(labels.join(",")));
        }
      }

      const res = await fetch(`/api/${endpoint}?${params.toString()}`);
      const data = await res.json();
      const query = new URLSearchParams(document.location.search);
      query.set("page", String(pageParam.page));
      router.replace(
        `/${
          endpoint === "favorite-reviews" ? "profile" : ""
        }?${query.toString()}`,
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

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    remove();
    refetch();
  }, [filters, refetch, remove]);

  useEffect(() => {
    const allReviews = data.pages.map((p) => p.reviews).flat();
    setAllReviews(allReviews);
  }, [data, setAllReviews]);

  return (
    <FavoritesContext.Provider value={{ favorites: favorites || [] }}>
      <div className="pt-6 md:pt-10 pb-32">
        <section
          role="feed"
          aria-busy={isFetching || isRefetching}
          aria-setsize={-1}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6 max-w-6xl mx-auto px-2 sm:px-8"
        >
          {data.pages.map((page, pageIndex) =>
            page.reviews.map((review, reviewIndex) => (
              <ReviewComponent
                key={`review-${review.albumTitle}`}
                index={pageIndex * PAGE_SIZE + (reviewIndex + 1)}
                {...review}
              />
            ))
          )}
        </section>

        <div
          ref={bottomRef}
          className="flex items-center w-full text-center justify-center"
        >
          <span className="text-xl my-12 font-medium">
            {(isFetching || isRefetching) && <LoadingLogoIcon />}
          </span>
        </div>
      </div>
    </FavoritesContext.Provider>
  );
};
