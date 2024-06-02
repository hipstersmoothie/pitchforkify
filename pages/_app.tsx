import { IdProvider } from "@radix-ui/react-id";
import { QueryClient, QueryClientProvider } from "react-query";
import { useKeyboardNavigation } from "@design-systems/hooks";

import "tailwindcss/tailwind.css";
import "@reach/combobox/styles.css";
import "../styles/global.css";
import "./global.css";

import { Header } from "../components/Header";
import {
  PlayerControls,
  PlayerStateContextProvider,
} from "../components/PlayerControls";
import { PlayerProvider } from "../utils/PlayerContext";
import { ReviewsContext } from "../utils/context";
import { useState } from "react";
import { Review } from "./api/reviews";
import { ClerkProvider } from "@clerk/nextjs";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  const [randomReview, setRandomReview] = useState<Review>();
  const [allReviews, setAllReviews] = useState(pageProps.reviews);

  useKeyboardNavigation();

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <IdProvider>
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
                  <main className="bg-gray-200 dark:bg-gray-950">
                    <Component {...pageProps} />
                  </main>
                  <PlayerControls />
                </PlayerStateContextProvider>
              </PlayerProvider>
            ) : (
              <Component {...pageProps} />
            )}
          </ReviewsContext.Provider>
        </IdProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
