/* eslint-disable jsx-a11y/role-supports-aria-props */
import * as Dialog from "@radix-ui/react-dialog";
import getYear from "date-fns/getYear";
import { useKeyboardNavigation } from "@design-systems/hooks";

import { CloseIcon } from "./icons/CloseIcon";
import { Review } from "../pages/api/reviews";

import { useState } from "react";
import { Score } from "./Score";
import { Tooltip } from "./Tooltip";
import { AlbumCover } from "./AlbumCover";
import { ArtistList } from "./ArtistList";
import { LabelList } from "./LabelList";

interface ReviewContentModalProps {
  review: Review;
  children: React.ReactNode;
}

export const ReviewContentModal = ({
  review,
  children,
}: ReviewContentModalProps) => {
  const isKeyboardNav = useKeyboardNavigation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root modal={true} open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="flex"
        asChild
        style={{ WebkitAppearance: "none" }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            setOpen(true);
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {children}
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
