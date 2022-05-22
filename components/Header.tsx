import { useSession, signIn, signOut } from "next-auth/react";
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

const AccountButton = ({
  className,
  ...props
}: React.ComponentProps<"button">) => (
  <button
    className={makeClass(
      className,
      "rounded px-4 h-10 cursor-pointer border border-gray-300 hover:bg-gray-100 active:bg-gray-200  focus:outline-none keyboard-focus:shadow-focus",
      "flex items-center justify-center"
    )}
    {...props}
  />
);

export const Header = () => {
  const [top, topSet] = useState<"hidden" | "shown">("hidden");
  const { data: session } = useSession();
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
        "h-16 w-full border-b border-gray-200 flex items-center sticky z-50 bg-white",
        top === "shown" ? "top-0 shadow-md" : "-top-16"
      )}
      style={{ transition: "top 0.5s" }}
    >
      <div className="max-w-6xl px-3 sm:px-8 w-full mx-auto flex justify-between items-center">
        <Link passHref href="/">
          <a className="flex items-center focus:outline-none keyboard-focus:shadow-focus rounded-lg">
            <span className="w-10 h-10 mr-4">
              <Image src={logo} alt="pitchforkify" />
            </span>
            <span className="font-bold product-name text-lg">Pitchforkify</span>
          </a>
        </Link>

        <div className="flex gap-4">
          <Tooltip message="Random Album" side="bottom">
            <button
              className="px-2 py-1 hover:bg-gray-100 rounded-lg"
              onClick={getRandomAlbum}
            >
              <SymbolIcon className={isFetchingRandom ? "animate-spin" : ""} />
            </button>
          </Tooltip>

          {session ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="focus:outline-none keyboard-focus:shadow-focus rounded-full">
                <div className="flex items-center gap-4">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt=""
                      height={40}
                      width={40}
                      className="rounded-full"
                      layout="fixed"
                    />
                  ) : (
                    <div className="rounded-full w-10 h-10 bg-gray-400 border flex items-center justify-center text-gray-100">
                      <PersonIcon className="h-[20px] w-[20px]" />
                    </div>
                  )}
                </div>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content
                className="border border-gray-400 rounded bg-white"
                sideOffset={10}
              >
                <DropdownMenu.Item
                  className="px-4 py-2 focus:outline-none keyboard-focus:shadow-focus-inner rounded cursor-pointer"
                  onClick={() => router.push("/profile")}
                >
                  Profile
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="px-4 py-2 focus:outline-none keyboard-focus:shadow-focus-inner rounded cursor-pointer"
                  onClick={() => signOut()}
                >
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ) : (
            <AccountButton onClick={() => signIn("spotify")}>
              Sign in
            </AccountButton>
          )}
        </div>
      </div>
    </nav>
  );
};
