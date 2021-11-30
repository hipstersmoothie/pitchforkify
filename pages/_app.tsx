import { SessionProvider } from "next-auth/react";
import { IdProvider } from "@radix-ui/react-id";
import { QueryClient, QueryClientProvider } from "react-query";
import { useKeyboardNavigation } from "@design-systems/hooks";

import "tailwindcss/tailwind.css";
import "@reach/combobox/styles.css";
import "../styles/global.css";

import { Header } from "../components/Header";
import {
  PlayerControls,
  PlayerStateContextProvider,
} from "../components/PlayerControls";
import { PlayerProvider } from "../utils/PlayerContext";
import { ReviewsContext } from "../utils/context";
import { useState } from "react";
import { Review } from "./api/reviews";

const queryClient = new QueryClient();

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [randomReview, setRandomReview] = useState<Review>();
  const [allReviews, setAllReviews] = useState(pageProps.reviews);

  useKeyboardNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      <IdProvider>
        <SessionProvider session={session}>
          <ReviewsContext.Provider
            value={{
              reviews: allReviews,
              setAllReviews,
              randomReview,
              setRandomReview,
            }}
          >
            {pageProps.layout === "app" ? (
              <PlayerProvider>
                <PlayerStateContextProvider>
                  <Header />
                  <main>
                    <Component {...pageProps} />
                  </main>
                  <PlayerControls />
                </PlayerStateContextProvider>
              </PlayerProvider>
            ) : (
              <Component {...pageProps} />
            )}
          </ReviewsContext.Provider>
        </SessionProvider>
      </IdProvider>
    </QueryClientProvider>
  );
}
