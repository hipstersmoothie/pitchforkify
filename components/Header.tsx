import Image from "next/image";
import Link from "next/link";
import makeClass from "clsx";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SymbolIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/router";

import logo from "../public/pitchforkify.png";
import { PersonIcon } from "./icons/PersonIcon";
import { useCallback, useContext, useEffect, useState } from "react";
import { Tooltip } from "./Tooltip";
import { usePlayAlbum } from "../utils/useSpotifyApi";
import { Review } from "../pages/api/reviews";
import { ReviewsContext } from "../utils/context";
import { SignOutButton, SignInButton, useSession } from "@clerk/nextjs";

const AccountButton = ({
  className,
  ...props
}: React.ComponentProps<"button">) => (
  <button
    className={makeClass(
      className,
      "rounded px-4 h-10 cursor-pointer focus:outline-none keyboard-focus:shadow-focus",
      "border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700",
      "active:bg-gray-200 bg-gray-50 bg-opacity-5 hover:bg-opacity-10",
      "text-gray-800 dark:text-gray-100",
      "flex items-center justify-center"
    )}
    {...props}
  />
);

export const Header = () => {
  const [top, topSet] = useState<"hidden" | "shown">("hidden");
  const { session } = useSession();
  const { setRandomReview } = useContext(ReviewsContext);
  const router = useRouter();
  const playAlbum = usePlayAlbum();

  useEffect(() => {
    let lastScroll = 0;

    function onScroll() {
      const currentScroll = window.scrollY;

      if (currentScroll > lastScroll || currentScroll === 0) {
        topSet("hidden");
      } else {
        topSet("shown");
      }

      lastScroll = currentScroll;
    }

    document.addEventListener("scroll", onScroll);

    return () => {
      document.removeEventListener("scroll", onScroll);
    };
  }, []);

  const [isFetchingRandom, isFetchingRandomSet] = useState(false);
  const getRandomAlbum = useCallback(async () => {
    isFetchingRandomSet(true);
    const res = await fetch("/api/random-album");
    const review = (await res.json()) as Review;

    await playAlbum(review);
    setRandomReview(review);
    isFetchingRandomSet(false);
  }, [playAlbum, setRandomReview]);

  return (
    <nav
      className={makeClass(
        "h-16 w-full flex items-center sticky z-50 bg-gray-100 dark:bg-gray-900",
        "border-b border-gray-100 dark:border-gray-800",
        top === "shown" ? "top-0 shadow-md" : "-top-16"
      )}
      style={{ transition: "top 0.5s" }}
    >
      <div className="max-w-screen-2xl px-3 sm:px-8 w-full mx-auto flex justify-between items-center">
        <Link
          passHref
          href="/"
          className="flex items-center focus:outline-none keyboard-focus:shadow-focus rounded-lg"
        >
          <span className="w-10 h-10 mr-4">
            <Image src={logo} alt="pitchforkify" />
          </span>
          <span className="font-bold product-name text-lg text-gray-700 dark:text-gray-300">
            Pitchforkify
          </span>
        </Link>

        <div className="flex gap-4">
          <Tooltip message="Random Album" side="bottom">
            <button
              className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 hover:bg-opacity-10 rounded-lg text-gray-100 dark:text-gray-100"
              onClick={getRandomAlbum}
            >
              <SymbolIcon className={isFetchingRandom ? "animate-spin" : ""} />
            </button>
          </Tooltip>

          {session ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="focus:outline-none keyboard-focus:shadow-focus rounded-full">
                <div className="flex items-center gap-4">
                  {session.user.hasImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.imageUrl}
                      alt=""
                      height={40}
                      width={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="rounded-full w-10 h-10 bg-gray-400 border flex items-center justify-center text-gray-100 dark:text-gray-100">
                      <PersonIcon className="h-[20px] w-[20px]" />
                    </div>
                  )}
                </div>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content
                className="border border-gray-400 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                sideOffset={10}
              >
                <DropdownMenu.Item
                  className="px-4 py-2 focus:outline-none keyboard-focus:shadow-focus-inner rounded cursor-pointer hover:bg-gray-50 hover:bg-opacity-10"
                  onClick={() => router.push("/profile")}
                >
                  Profile
                </DropdownMenu.Item>
                <SignOutButton>
                  <DropdownMenu.Item className="px-4 py-2 focus:outline-none keyboard-focus:shadow-focus-inner rounded cursor-pointer hover:bg-gray-50 hover:bg-opacity-10">
                    Sign out
                  </DropdownMenu.Item>
                </SignOutButton>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ) : (
            <SignInButton>
              <AccountButton>Sign in</AccountButton>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
};
