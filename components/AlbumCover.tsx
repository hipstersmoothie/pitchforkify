import Image from "next/image";
import makeClass from "clsx";
import contrast from "contrast";
import FastAverageColor from "fast-average-color";

import { Review } from "../pages/api/reviews";

import { usePlayAlbum, useSpotifyApi } from "../utils/useSpotifyApi";
import { PlayButton } from "../components/PlayButton";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { FavoriteButton } from "./FavoriteButton";
import { AlbumUserMetadataContext } from "../utils/context";
import { CheckIcon } from "@radix-ui/react-icons";

const averageColor = new FastAverageColor();

interface AlbumCoverProps extends React.ComponentProps<"div"> {
  review: Review;
}

export const AlbumCover = ({
  className,
  review,
  ...props
}: AlbumCoverProps) => {
  const wrapperRef = useRef<HTMLDivElement>();
  const playAlbum = usePlayAlbum();
  const spotifyApi = useSpotifyApi();
  const { favorites, played } = useContext(AlbumUserMetadataContext);
  const isSavedOnDb = favorites.includes(review.spotifyAlbum);
  const [hasBeenPlayed, hasBeenPlayedSet] = useState(
    played.includes(review.spotifyAlbum)
  );
  const [isSaved, setIsSaved] = useState(isSavedOnDb);
  const [isDarkImage, isDarkImageSet] = useState(false);

  useEffect(() => {
    setIsSaved(isSavedOnDb);
  }, [isSavedOnDb]);

  useEffect(() => {
    if (played.includes(review.spotifyAlbum)) {
      hasBeenPlayedSet(true);
    }
  }, [played, review.spotifyAlbum]);

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
          onClick={async (e) => {
            e.stopPropagation();
            playAlbum(review);
            hasBeenPlayedSet(true);
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

      {hasBeenPlayed && (
        <div
          className={makeClass(
            "absolute inset-0 pointer-events-none text-white",
            !isSaved && "bg-opacity-40 bg-gray-200"
          )}
        >
          <div className="text-white bg-white p-1 m-1.5 text-lg absolute bottom-0 left-0">
            <div className="p-2 bg-pitchfork flex items-center justify-center">
              <CheckIcon className="h-4 w-4 " />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
