import { useSession, signIn } from "next-auth/react";
import { GetStaticProps } from "next";
import Head from "next/head";
import { useEffect } from "react";

import { getReviews } from "./api/reviews";
import { ReviewGrid, ReviewGridProps } from "../components/ReviewGrid";

export default function Home({ reviews }: Omit<ReviewGridProps, "endpoint">) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn("spotify");
    } else if (session?.accessToken) {
      fetch("/api/pull-favorites");
    }
  }, [session]);

  return (
    <div className="">
      <Head>
        <title>pitchforkify</title>
        <meta
          name="description"
          content="Easily browse and listen to pitchfork album reviews"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ReviewGrid reviews={reviews} page={1} endpoint="reviews" />
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const reviews = await getReviews({ page: 1 });

  return {
    props: { reviews },
    revalidate: 60 * 60 * 6,
  };
};
