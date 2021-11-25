import type { NextApiRequest, NextApiResponse } from "next";
import stringSimilarity from "string-similarity";

import artists from "../../public/artists.json";
import labels from "../../public/labels.json";

const allData = [
  ...artists.map((a) => ({ ...a, type: "artist" })),
  ...labels.map((a) => ({ ...a, type: "label" })),
];

export default async function search(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = (req.query.search as string).toLowerCase();
  const results = allData
    .filter((i) => i.name.toLowerCase().includes(query))
    .map(
      (i) =>
        [
          stringSimilarity.compareTwoStrings(query, i.name.toLowerCase()),
          i,
        ] as const
    )
    .sort(([a], [b]) => b - a)
    .map(([, a]) => a);

  res.status(200).json(results);
}
