/* eslint-disable jsx-a11y/role-supports-aria-props */

import { useRouter } from "next/router";
import makeClass from "clsx";
import { useInfiniteQuery, useQuery } from "react-query";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import contrast from "contrast";
import FastAverageColor from "fast-average-color";

import { LoadingLogoIcon } from "./icons/LoadingLogo";
import { Review } from "../pages/api/reviews";

import useIntersectionObserver from "../utils/useIntersectionObserver";

import { GridFilters } from "./GridFilter";
import { PAGE_SIZE } from "../utils/constants";
import { AlbumUserMetadataContext, ReviewsContext } from "../utils/context";
import { ArtistList } from "./ArtistList";
import { ReviewContentModal } from "./ReviewContentModal";
import Image from "next/image";
import { useMousePosition } from "../utils/useMousePosition";
import { useSize } from "../utils/useSize";
import { clamp } from "../utils/clamp";
import { PlayButton } from "./PlayButton";
import { usePlayAlbum, useSpotifyApi } from "../utils/useSpotifyApi";
import { PlayerStateContext } from "./PlayerControls";
import { FavoriteButton } from "./FavoriteButton";
import { TinyScore } from "./Score";

const ReviewComponent = (review: Review & { index: number }) => {
  const playAlbum = usePlayAlbum();
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const trackListToggle =
      document.querySelector<HTMLElement>("#track-list-toggle");
    const gridFilter = document.querySelector<HTMLElement>("#grid-filter");

    if (
      (e.key === "ArrowRight" || e.key === "PageDown") &&
      document.activeElement?.nextSibling
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
      document.activeElement?.previousSibling
    ) {
      e.stopPropagation();
      e.preventDefault();
      (document.activeElement.previousSibling as HTMLElement).focus();
    }
  }, []);
  const { favorites, played } = useContext(AlbumUserMetadataContext);
  const { playerState } = useContext(PlayerStateContext);
  const isBeingPlayed = playerState.album === review.spotifyAlbum;
  const [hasBeenPlayed, hasBeenPlayedSet] = useState(
    review.spotifyAlbum && played.includes(review.spotifyAlbum)
  );
  const isSavedOnDb = Boolean(
    review.spotifyAlbum && favorites.includes(review.spotifyAlbum)
  );
  const [isSaved, setIsSaved] = useState(isSavedOnDb);

  useEffect(() => {
    setIsSaved(isSavedOnDb);
  }, [isSavedOnDb]);

  useEffect(() => {
    if (review.spotifyAlbum && played.includes(review.spotifyAlbum)) {
      hasBeenPlayedSet(true);
    }
  }, [played, review.spotifyAlbum]);

  useEffect(() => {
    if (isBeingPlayed) {
      hasBeenPlayedSet(true);
    }
  }, [played, review.spotifyAlbum, isBeingPlayed]);

  const mouse = useMousePosition();
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);
  const centerX = size.width / 2;
  const centerY = size.height / 2;

  function getTranslate(value: number, initialValue: number, center: number) {
    if (!mouse.isHovering) {
      return 0;
    }

    if (value < initialValue) {
      const percentage = (initialValue - value) / center;
      console.log({ value, initialValue, center, percentage });
      return clamp(percentage, 0, 1) * 5;
    } else {
      const percentage = (value - initialValue) / center;
      return clamp(percentage, 0, 1) * -5;
    }
  }

  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [isDarkImage, isDarkImageSet] = useState(false);

  useEffect(() => {
    const imageWrapper = imageWrapperRef.current;

    if (!imageWrapper) {
      return;
    }

    const averageColor = new FastAverageColor();
    const img = imageWrapper.querySelector("img");

    if (!img) {
      return;
    }

    async function determineBackgroundColor(e: Event) {
      if (!(e.target instanceof HTMLImageElement)) {
        return;
      }

      const color = await averageColor.getColorAsync(e.target, {
        top: 0,
        left: 0,
        width: 40,
        height: 40,
      });

      console.log("dark", contrast(color.hex) === "dark");
      isDarkImageSet(contrast(color.hex) === "dark");
    }

    img.addEventListener("load", determineBackgroundColor);

    return () => {
      img.removeEventListener("load", determineBackgroundColor);
    };
  }, []);

  const spotifyApi = useSpotifyApi();
  const toggleFavorite = useCallback(async () => {
    if (!review.spotifyAlbum || !spotifyApi) {
      return;
    }

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
    <ReviewContentModal review={review}>
      <article
        className={`
          review-item 
          group
          flex flex-col items-center text-center 
          cursor-pointer 
          focus:outline-none keyboard-focus:shadow-focus 
          rounded-2xl
          before:content-['']
          before:absolute before:inset-0
          before:rounded-2xl before:shadow-xl
          before:opacity-0 before:transition-opacity before:duration-300
          hover:before:opacity-100
          relative z-0
          shadow-inner
          after:pointer-events-none
          ${hasBeenPlayed && !isBeingPlayed && "grayscale opacity-50"}
          ${
            review.isBestNew &&
            `
              after:absolute after:inset-0 after:z-10
              after:content-[''] after:rounded-[18px] 
              after:shadow-[inset_0px_0px_0px_8px_#ff3530]
            `
          }
          ${
            isBeingPlayed &&
            !review.isBestNew &&
            `
              after:absolute after:inset-0 after:z-10
              after:content-[''] after:rounded-[18px] 
              after:shadow-[inset_0px_0px_0px_8px_rgba(255,255,255,0.6)]
            `
          }
        `}
        aria-posinset={review.index}
        tabIndex={0}
        aria-label={`Open Review for ${review.albumTitle}`}
        onKeyDown={onKeyDown}
      >
        <div
          ref={imageWrapperRef}
          className={`absolute inset-0 -z-1 rounded-2xl overflow-hidden border border-gray-200 border-opacity-50`}
        >
          <motion.div
            variants={{
              idle: {
                scale: 1,
                transition: { duration: 0.5 },
              },
              hovering: {
                scale: 1.05,
                transition: { duration: 0.5 },
              },
            }}
            animate={mouse.isHovering ? "hovering" : "idle"}
            className="relative overflow-hidden rounded-2xl"
            layoutId={`card-container-${review.id}`}
          >
            <motion.div
              variants={{
                idle: {
                  translateX: 0,
                  translateY: 0,
                  transition: { duration: 0.5 },
                },
                hovering: {
                  translateX:
                    mouse.point.x && mouse.initialPoint.x
                      ? getTranslate(
                          mouse.point.x,
                          mouse.initialPoint.x,
                          centerX
                        )
                      : 0,
                  translateY:
                    mouse.point.y && mouse.initialPoint.y
                      ? getTranslate(
                          mouse.point.y,
                          mouse.initialPoint.y,
                          centerY
                        )
                      : 0,
                  transition: { duration: 0.5 },
                },
              }}
              animate={mouse.isHovering ? "hovering" : "idle"}
              layoutId={`card-image-container-${review.id}`}
            >
              <Image
                src={review.cover.replace("_160", "_400")}
                height={600}
                width={600}
                alt=""
                layout="responsive"
              />
            </motion.div>
          </motion.div>
        </div>
        <div
          className="
            rounded-2xl p-4
            w-full aspect-square z-10 flex flex-col justify-between items-center
            bg-gradient-to-t from-[#000000aa] to-[#ffffff00]
          "
          ref={ref}
          {...mouse.props}
        >
          <div className="flex items-center justify-between w-full">
            <FavoriteButton
              className={makeClass(
                "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
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
            <TinyScore score={review.score} isBestNew={review.isBestNew} />
          </div>

          {review.spotifyAlbum && (
            <PlayButton
              isPlaying={isBeingPlayed}
              barAnimation={true}
              className={`
                absolute top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2 
                opacity-0 group-hover:opacity-100 focus:opacity-100
                ${isBeingPlayed && "opacity-100"}
                transition-opacity
              `}
              aria-label={`Play ${review.albumTitle}`}
              onClick={async (e) => {
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

          <div
            className="flex flex-col justify-end items-center"
            style={{
              textShadow: "0 2px 3px rgba(0, 0, 0, 0.3)",
            }}
          >
            <motion.div layoutId={`card-artist-${review.id}`}>
              <ArtistList
                className="italic mb-1 text-gray-100"
                review={review}
              />
            </motion.div>
            <motion.h2
              layoutId={`card-title-${review.id}`}
              className="font-bold text-gray-50 mb-2 text-xl"
            >
              {review.albumTitle}
            </motion.h2>
            <ul className="text-[0.65rem] font-bold uppercase flex text-gray-200">
              {review.genres.map((genre) => (
                <li
                  className="after:content-['/'] last:after:content-[''] after:px-1 last:after:px-0"
                  key={`${genre.id}-${review.id}`}
                >
                  {genre.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </ReviewContentModal>
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const { setAllReviews } = useContext(ReviewsContext);
  const router = useRouter();

  const { data: favorites } = useQuery("/api/favorites", async () => {
    const req = await fetch("/api/favorites");
    return req.json() as Promise<string[]>;
  });

  const { data: played } = useQuery("/api/played", async () => {
    const req = await fetch("/api/played");
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

      if (pageParam?.cursor) {
        params.set("cursor", String(pageParam.cursor));
      } else if (pageParam?.page) {
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

      if (pageParam?.page) {
        query.set("page", String(pageParam.page));
      }

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
          page: pageParam ? pageParam.page + 1 : 1,
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
    if (!data) {
      return;
    }

    const allReviews = data.pages.map((p) => p.reviews).flat();
    setAllReviews(allReviews);
  }, [data, setAllReviews]);

  return (
    <AlbumUserMetadataContext.Provider
      value={{ favorites: favorites || [], played: played || [] }}
    >
      <div className="pt-6 md:pt-10 pb-32">
        <section
          role="feed"
          aria-busy={isFetching || isRefetching}
          aria-setsize={-1}
          className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-2 max-w-screen-2xl mx-auto px-2 sm:px-8"
        >
          {data?.pages.map((page, pageIndex) =>
            page.reviews.map((review, reviewIndex) => (
              <ReviewComponent
                key={`review-${review.albumTitle}-${pageIndex}-${reviewIndex}`}
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
    </AlbumUserMetadataContext.Provider>
  );
};
