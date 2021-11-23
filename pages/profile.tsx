import Head from "next/head";
import { getSession, useSession } from "next-auth/react";
import Image from "next/image";

import { ReviewGrid, ReviewGridProps } from "../components/ReviewGrid";
import prisma from "../utils/primsa";
import { Score } from "../components/Score";
import { PersonIcon } from "../components/icons/PersonIcon";
import { getAllFavoritesUrisForSession } from "./api/favorites";

interface ProfileProps
  extends Omit<ReviewGridProps, "endpoint" | "extraParams" | "reviews"> {
  score: number;
  totalAlbumsWithReviews: number;
}

export default function Profile({
  page,
  score,
  totalAlbumsWithReviews,
}: ProfileProps) {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div>
      <Head>
        <title>{session.user.name}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex items-end  max-w-6xl mx-auto px-4 md:px-16 pt-10 md:pt-20 pb-6 md:pb-12 gap-6 md:gap-8">
        <div className="w-1/4 mr-10 hidden md:block">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt=""
              height={400}
              width={400}
              className="rounded-full"
              layout="responsive"
            />
          ) : (
            <div className="bg-gray-400 rounded-full relative w-full pt-[100%] shadow-xl">
              <PersonIcon className="text-gray-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="uppercase font-medium mb-4">Profile</div>
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-medium lg:font-black mb-5">
            {session.user.name}
          </h1>
          <div className="text-gray-700">
            {totalAlbumsWithReviews} Favorites with Reviews
          </div>
        </div>

        <div className="flex items-center justify-center self-stretch">
          <Score isBig="responsive" score={score} isBestNew />
        </div>
      </div>

      <ReviewGrid reviews={[]} page={page} endpoint="favorite-reviews" />
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const page = ctx.query.page ? Number(ctx.query.page) : 1;
  const session = await getSession(ctx);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const allFavorites = await getAllFavoritesUrisForSession(session);
  const counts = await prisma.review.aggregate({
    where: {
      spotifyAlbum: {
        in: allFavorites,
      },
    },
    _avg: {
      score: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    props: {
      page,
      score: counts._avg.score || 0,
      totalAlbumsWithReviews: counts._count.id,
    },
  };
}
