import { useSession, signIn } from "next-auth/client";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect } from "react";

import { getReviews, Review } from "./api/reviews";
import { ReviewGrid, ReviewGridProps } from "../components/ReviewGrid";

export default function Home({
  reviews,
  page,
}: Omit<ReviewGridProps, "endpoint">) {
  const [session] = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn();
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

      <ReviewGrid reviews={reviews} page={page} endpoint="reviews" />

      {/* <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer> */}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const page = context.query.page ? Number(context.query.page) : 1;
  const reviews = await getReviews({ page });

  return {
    props: { reviews, page },
  };
};
