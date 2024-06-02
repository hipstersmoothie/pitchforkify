/* eslint-disable jsx-a11y/role-supports-aria-props */
import * as Dialog from "@radix-ui/react-dialog";
import getYear from "date-fns/getYear";
import { useKeyboardNavigation } from "@design-systems/hooks";

import { CloseIcon } from "./icons/CloseIcon";
import { Review } from "../pages/api/reviews";

import { useState } from "react";
import { TinyScore } from "./Score";
import { Tooltip } from "./Tooltip";
import { ArtistList } from "./ArtistList";
import { LabelList } from "./LabelList";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

interface ReviewContentModalProps {
  review?: Review;
  children: React.ReactNode;
}

export const ReviewContentModal = ({
  review,
  children,
}: ReviewContentModalProps) => {
  const isKeyboardNav = useKeyboardNavigation();
  const [open, setOpen] = useState(false);

  if (!review) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence>
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
        <Dialog.Overlay
          className="bg-gray-900 bg-opacity-80 fixed inset-0"
          asChild={true}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          ></motion.div>
        </Dialog.Overlay>
        <Dialog.Content
          className="overflow-auto h-screen w-screen fixed inset-0"
          onOpenAutoFocus={(e) => {
            if (!isKeyboardNav) {
              e.preventDefault();
            }
          }}
          style={{ pointerEvents: "none" }}
        >
          <div className="my-10 max-w-[80ch] mx-auto w-full relative pointer-events-auto">
            <motion.div
              className="
                bg-gray-50 dark:bg-gray-800
                border border-gray-100 dark:border-gray-700
                dark:text-gray-50 
                rounded-2xl overflow-hidden
              "
              layoutId={`card-container-${review.id}`}
            >
              <div className="flex items-center gap-6 pt-2 px-2">
                <motion.div
                  layoutId={`card-image-container-${review.id}`}
                  className={`
                    rounded-xl overflow-hidden w-1/3 flex-shrink-0 relative
                    ${
                      review.isBestNew &&
                      `
                        after:absolute after:inset-0 after:z-10
                        after:content-[''] after:rounded-xl
                        after:shadow-[inset_0px_0px_0px_8px_#ff3530]
                      `
                    }
                  `}
                >
                  <Image
                    src={review.cover.replace("_160", "_400")}
                    height={300}
                    width={300}
                    alt=""
                    layout="responsive"
                  />
                  <TinyScore
                    score={review.score}
                    isBestNew={review.isBestNew}
                    className="absolute left-3 top-3"
                  />
                </motion.div>
                <div className="flex flex-col gap-2">
                  <motion.div layoutId={`card-artist-${review.id}`}>
                    <ArtistList review={review} className="italic text-4xl" />
                  </motion.div>
                  <motion.h2
                    layoutId={`card-title-${review.id}`}
                    className="font-semibold text-6xl break-keep"
                  >
                    {review.albumTitle}
                  </motion.h2>
                  <div className="flex items-center gap-1 dark:text-gray-300 text-xs uppercase h-8">
                    <LabelList review={review} />
                    <span>{" • "}</span>
                    <span>{getYear(new Date(review.publishDate))}</span>
                  </div>
                </div>
              </div>

              <motion.div
                animate
                className="mx-auto w-[fit-content] px-6 pb-10"
                dangerouslySetInnerHTML={{
                  __html: `<div className="body__container">${review.reviewHtml}</div>`,
                }}
              />

              <Tooltip message="Close Review">
                <Dialog.Close asChild>
                  <button className="absolute top-0 right-0 p-3 m-1 text-gray-400 hover:text-white focus:outline-none keyboard-focus:shadow-focus-tight rounded">
                    <CloseIcon />
                  </button>
                </Dialog.Close>
              </Tooltip>
            </motion.div>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </AnimatePresence>
  );
};
