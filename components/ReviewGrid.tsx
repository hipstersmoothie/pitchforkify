/* eslint-disable jsx-a11y/role-supports-aria-props */
import { useRouter } from "next/router";
import { useInfiniteQuery, useQuery } from "react-query";
import { useContext, useEffect, useRef } from "react";
import format from "date-fns/format";
import makeClass from "clsx";

import { LoadingLogoIcon } from "./icons/LoadingLogo";
import { Review } from "../pages/api/reviews";

import useIntersectionObserver from "../utils/useIntersectionObserver";

import { Score } from "./Score";
import { GridFilters } from "./GridFilter";
import { PAGE_SIZE } from "../utils/constants";
import { AlbumUserMetadataContext, ReviewsContext } from "../utils/context";
import { AlbumCover } from "./AlbumCover";
import { ArtistList } from "./ArtistList";
import { LabelList } from "./LabelList";
import { ReviewContentModal } from "./ReviewContentModal";

const ReviewComponent = (review: Review & { index: number }) => {
  return (
    <ReviewContentModal review={review}>
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
  const bottomRef = useRef<HTMLDivElement>();
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
    <AlbumUserMetadataContext.Provider
      value={{ favorites: favorites || [], played: played || [] }}
    >
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
