import { Provider as SessionProvider } from "next-auth/client";
import { IdProvider } from "@radix-ui/react-id";
import {
  useInfiniteQuery,
  QueryClient,
  QueryClientProvider,
} from "react-query";

import "tailwindcss/tailwind.css";
import "../styles/global.css";

const queryClient = new QueryClient();

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <IdProvider>
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </IdProvider>
    </QueryClientProvider>
  );
}
