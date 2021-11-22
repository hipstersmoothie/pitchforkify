import { useSession, signIn, signOut } from "next-auth/client";
import Image from "next/image";
import Link from "next/link";
import makeClass from "clsx";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import logo from "../public/pitchforkify.png";
import { PersonIcon } from "./icons/PersonIcon";

const AccountButton = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={makeClass(
      className,
      "rounded px-4 h-10 cursor-pointer border border-gray-300 hover:bg-gray-100 active:bg-gray-200",
      "flex items-center justify-center"
    )}
    {...props}
  />
);

export const Header = () => {
  const [session] = useSession();

  return (
    <div className="h-16 w-full border-b border-gray-200 flex items-center">
      <div className="max-w-6xl px-3 md:px-8 w-full mx-auto flex justify-between items-center">
        <Link passHref href="/">
          <a className="flex items-center">
            <span className="w-10 h-10 mr-4">
              <Image src={logo} alt="pitchforkify" />
            </span>
            <span className="font-bold product-name text-lg">Pitchforkify</span>
          </a>
        </Link>

        <div className="flex gap-4">
          {session ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
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
                <DropdownMenu.Item>
                  <Link passHref href="/profile">
                    <a className="px-4 py-2 block">Profile</a>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                  <button className="px-4 py-2" onClick={() => signOut()}>
                    Sign out
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ) : (
            <AccountButton onClick={() => signIn()}>Sign in</AccountButton>
          )}
        </div>
      </div>
    </div>
  );
};
