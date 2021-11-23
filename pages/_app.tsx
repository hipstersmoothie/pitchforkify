import { SessionProvider } from "next-auth/react";
import { IdProvider } from "@radix-ui/react-id";
import { QueryClient, QueryClientProvider } from "react-query";

import "tailwindcss/tailwind.css";
import "../styles/global.css";

import { Header } from "../components/Header";
import { PlayerControls } from "../components/PlayerControls";
import { PlayerProvider } from "../utils/PlayerContext";
import { ReviewsContext } from "../utils/context";

const queryClient = new QueryClient();

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <IdProvider>
        <SessionProvider session={session}>
          <ReviewsContext.Provider value={{ reviews: pageProps.reviews }}>
            <PlayerProvider>
              <Header />
              <main>
                <Component {...pageProps} />
              </main>
              <PlayerControls />
            </PlayerProvider>
          </ReviewsContext.Provider>
        </SessionProvider>
      </IdProvider>
    </QueryClientProvider>
  );
}
