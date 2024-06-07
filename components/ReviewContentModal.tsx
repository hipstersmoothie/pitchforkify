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
          className="flex data-[state=open]:z-50 focus:z-50"
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
          <div className="my-10 px-4 max-w-[80ch] mx-auto w-full relative pointer-events-auto">
            <motion.div
              className="
                bg-gray-50 dark:bg-gray-800
                border border-gray-100 dark:border-gray-700
                dark:text-gray-50 
                rounded-2xl overflow-hidden
              "
              layoutId={`card-container-${review.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="flex items-center gap-6 pt-2 px-2 z-0 relative">
                <motion.div
                  layoutId={`card-image-container-${review.id}`}
                  className={`
                    rounded-xl overflow-hidden flex-shrink-0
                    absolute inset-0 bottom-[-75%] z-[-1]
                    ${
                      review.isBestNew &&
                      false &&
                      `
                        after:absolute after:inset-0 after:z-10
                        after:content-[''] after:rounded-xl
                        after:shadow-[inset_0px_0px_0px_8px_#ff3530]
                      `
                    }

                    after:absolute after:inset-0 after:z-10
                    after:content-[''] after:rounded-xl
                    after:bg-gradient-to-t after:from-gray-50 dark:after:from-gray-800
                  `}
                >
                  <Image
                    src={review.cover.replace("_160", "_400")}
                    height={300}
                    width={300}
                    className="w-full"
                    alt=""
                    layout="responsive"
                  />
                </motion.div>
                <div className="flex flex-col gap-2 pt-10 px-4 md:pt-20 md:pb-6">
                  <motion.div
                    layoutId={`card-score-${review.id}`}
                    className="absolute left-6 top-8"
                  >
                    <div
                      className={` 
                        ${
                          review.isBestNew
                            ? "bg-[#ff3530] bg-opacity-90 text-[#fae0e0]"
                            : "bg-gray-50 bg-opacity-50"
                        }
                        backdrop-blur-sm 
                        rounded px-2 py-1
                        text-gray-900
                      `}
                    >
                      {review.score.toFixed(1)}
                    </div>
                  </motion.div>
                  <motion.div layoutId={`card-artist-${review.id}`}>
                    <ArtistList
                      review={review}
                      className="italic text-xl md:text-4xl"
                    />
                  </motion.div>
                  <motion.h2
                    layoutId={`card-title-${review.id}`}
                    className="font-semibold text-4xl md:text-6xl break-keep"
                  >
                    {review.albumTitle}
                  </motion.h2>
                  <div className="flex flex-col gap-2 mt-3 dark:text-gray-300 text-xs uppercase">
                    <motion.ul
                      layoutId={`card-genres-${review.id}`}
                      className="text-[0.65rem] font-bold uppercase flex text-gray-200"
                    >
                      {review.genres.map((genre) => (
                        <li
                          className="after:content-['/'] last:after:content-[''] after:px-1 last:after:px-0"
                          key={`${genre.id}-${review.id}`}
                        >
                          {genre.name}
                        </li>
                      ))}
                    </motion.ul>
                    <motion.div
                      className="flex items-center gap-1 dark:text-gray-300 text-xs uppercase"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <LabelList review={review} />
                      <span>{" • "}</span>
                      <span>{getYear(new Date(review.publishDate))}</span>
                    </motion.div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ translateY: -20 }}
                animate={{ translateY: 0 }}
                exit={{ translateY: 20 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mx-auto w-[fit-content] px-6 pb-10 relative"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  dangerouslySetInnerHTML={{
                    __html: `<div className="body__container">${review.reviewHtml}</div>`,
                  }}
                />
              </motion.div>

              <Tooltip message="Close Review">
                <Dialog.Close asChild>
                  <button className="absolute top-4 right-6 p-3 text-gray-400 hover:text-white focus:outline-none keyboard-focus:shadow-focus-tight rounded">
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
