import Head from "next/head";
import Image from "next/image";
import { useSession } from "@clerk/nextjs";
import { clerkClient, getAuth } from "@clerk/nextjs/server";

import { ReviewGrid, ReviewGridProps } from "../components/ReviewGrid";
import prisma from "../utils/primsa";
import { Score } from "../components/Score";
import { PersonIcon } from "../components/icons/PersonIcon";
import { getAllFavoritesUrisForSession } from "./api/favorites";
import { GridFilter, useGridFilters } from "../components/GridFilter";
import SpotifyWebApi from "spotify-web-api-node";

interface ProfileProps
  extends Omit<ReviewGridProps, "endpoint" | "extraParams" | "reviews"> {
  score: number;
  totalAlbumsWithReviews: number;
  detailedUser: SpotifyApi.CurrentUsersProfileResponse;
}

export default function Profile({
  page,
  score,
  totalAlbumsWithReviews,
  detailedUser,
}: ProfileProps) {
  const { session } = useSession();
  const [filters, setFilters] = useGridFilters();

  if (!session) {
    return null;
  }

  console.log(detailedUser);
  return (
    <div>
      <Head>
        <title>{session.user.fullName}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex items-center max-w-screen-2xl mx-auto px-4 md:px-16 pt-10 md:pt-20 pb-6 md:pb-12 gap-6 md:gap-8">
        <div className="w-1/5 mr-10 hidden md:block">
          {detailedUser.images?.[1].url ? (
            <Image
              src={detailedUser.images[1].url}
              alt=""
              height={300}
              width={300}
              className="rounded-full"
              layout="responsive"
            />
          ) : (
            <div className="bg-gray-400 rounded-full relative w-full pt-[100%] shadow-xl">
              <PersonIcon className="text-gray-100 dark:text-gray-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="uppercase font-medium mb-4 text-gray-600 dark:text-gray-400">
            Profile
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-medium lg:font-black mb-5 text-gray-900 dark:text-gray-100">
            {session.user.fullName}
          </h1>
          <div className="text-gray-700 dark:text-gray-400">
            {totalAlbumsWithReviews} Favorites with Reviews
          </div>
        </div>

        <div className="flex items-center justify-center self-stretch">
          <Score isBig="responsive" score={score} isBestNew />
        </div>
      </div>

      {/* <GridFilter filters={filters} setFilters={setFilters} /> */}
      <ReviewGrid
        reviews={[]}
        filters={filters}
        page={page}
        endpoint="favorite-reviews"
      />
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const page = ctx.query.page ? Number(ctx.query.page) : 1;
  const { userId } = getAuth(ctx.req);

  if (!userId) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const tokenData = await clerkClient.users.getUserOauthAccessToken(
    userId,
    "oauth_spotify"
  );

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    accessToken: tokenData.data[0].token,
  });

  const allFavorites = await getAllFavoritesUrisForSession(userId);
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
      layout: "app",
      detailedUser: (await spotifyApi.getMe()).body,
    },
  };
}
