import { useSession, signIn } from "next-auth/react";
import { GetStaticProps } from "next";
import Head from "next/head";
import { useEffect } from "react";

import { getReviews } from "./api/reviews";
import { ReviewGrid, ReviewGridProps } from "../components/ReviewGrid";
import {
  GridFilter,
  hasActiveFilters,
  useGridFilters,
} from "../components/GridFilter";

export default function Home({ reviews }: Omit<ReviewGridProps, "endpoint">) {
  const { data: session } = useSession();
  const [filters, setFilters] = useGridFilters();

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

      <GridFilter filters={filters} setFilters={setFilters} />

      <ReviewGrid
        reviews={hasActiveFilters(filters) ? [] : reviews}
        filters={filters}
        page={1}
        endpoint="reviews"
      />
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const reviews = await getReviews({ page: 1 });

  return {
    props: { reviews, layout: "app" },
    revalidate: 60 * 60 * 6,
  };
};
