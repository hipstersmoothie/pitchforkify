import { useSession, signIn, signOut } from "next-auth/client";
import Image from 'next/image'
import makeClass from "clsx";

const AccountButton = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={makeClass(
      className,
      "rounded px-4 h-10 cursor-pointer text-white bg-[#1db954] hover:bg-green-600 active:bg-green-700",
      "flex items-center justify-center"
    )}
    {...props}
  />
);

export const Header = () => {
  const [session] = useSession();

  return (
    <div className="h-16 w-full border-b border-gray-200 flex items-center">
      <div className="max-w-6xl px-8 w-full mx-auto flex justify-between items-center">
        <span className="font-bold">pitchforkify</span>

        <div className="flex gap-4">
          {session?.user && (
            <div className="flex items-center gap-4">
              <Image
                src={session.user.image}
                alt=""
                height={40}
                width={40}
                className="rounded-full"
                layout="fixed"
              />
            </div>
          )}

          {session ? (
            <AccountButton onClick={() => signOut()}>Sign out</AccountButton>
          ) : (
            <AccountButton onClick={() => signIn()}>Sign in</AccountButton>
          )}
        </div>
      </div>
    </div>
  );
};
