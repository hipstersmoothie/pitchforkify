import { useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function useSpotifyAccessToken() {
  const { session } = useSession();
  const [token, tokenSet] = useState<string>();

  useEffect(() => {
    if (!session) {
      return;
    }

    fetch("/api/get-token")
      .then((r) => r.json())
      .then(({ token }) => tokenSet(token));
  }, [session]);

  return token;
}
