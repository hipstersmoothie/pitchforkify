import { Provider as SessionProvider } from "next-auth/client";
import { IdProvider } from "@radix-ui/react-id";

import "tailwindcss/tailwind.css";
import "../styles/global.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <IdProvider>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </IdProvider>
  );
}
