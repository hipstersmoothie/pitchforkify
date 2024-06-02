import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function getToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(404).json({ message: "User not found" });
  }

  const tokenData = await clerkClient.users.getUserOauthAccessToken(
    userId,
    "oauth_spotify"
  );

  return res.status(200).json({
    token: tokenData.data[0].token,
  });
}
