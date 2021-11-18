import { Provider as SessionProvider } from "next-auth/client";

import "tailwindcss/tailwind.css";
import '../styles/global.css'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
