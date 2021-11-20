import type { NextApiRequest, NextApiResponse } from "next";
import cheerio, { CheerioAPI, Element } from "cheerio";
import fetch from "isomorphic-fetch";
import SpotifyWebApi from "spotify-web-api-node";
import prisma from "../../utils/primsa";
import { sleep } from "../../utils/sleep";

const rootUrl = "https://pitchfork.com";

let spotifyApi: SpotifyWebApi;

async function setupSpotifyApi() {
  spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  const token = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(token.body["access_token"]);
}

function getReviewPageUrl(page: number) {
  return `${rootUrl}/reviews/albums/?page=${page}`;
}

async function getPage(url: string) {
  const response = await fetch(url);
  const html = await response.text();

  return cheerio.load(html);
}

async function searchAlbums(artist: string, album: string) {
  try {
    const {
      body: {
        albums: { items },
      },
    } = await spotifyApi.search(`${artist} ${album.replace("EP", "")}`, [
      "album",
    ]);

    return items;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

interface ParsedReview {
  albumTitle: string;
  cover: string;
  spotifyAlbum: string;
  score: number;
  publishDate: string;
  isBestNew: boolean;
  labels: { name: string }[];
  artists: { name: string }[];
  genres: { name: string }[];
  reviewHtml: string;
}

async function parseReview(
  $reviewPage: CheerioAPI,
  reviewEl: Element
): Promise<ParsedReview> {
  const $reviewPagee = await getPage(
    `${rootUrl}${$reviewPage(".review__link", reviewEl).attr("href")}`
  );
  const reviewHtml = $reviewPagee(".review-detail__article-content")
    .first()
    .html();

  if (!reviewHtml) {
    console.log("Throttled by Pitchfork. Waiting...");
    await sleep(30 * 1000);
    return parseReview($reviewPage, reviewEl);
  }

  const albumTitle = $reviewPage(".review__title-album", reviewEl).text();
  const artists = $reviewPage(".review__title-artist li", reviewEl)
    .toArray()
    .map((artist) => ({ name: $reviewPage(artist).text() }));
  const albums = await searchAlbums(artists[0].name, albumTitle);

  return {
    albumTitle: $reviewPage(".review__title-album", reviewEl).text(),
    cover: $reviewPage(".review__artwork img", reviewEl).attr("src"),
    spotifyAlbum: albums[0]?.uri || null,
    score: Number($reviewPagee(".score").first().text()),
    publishDate: $reviewPage(".pub-date", reviewEl).attr("datetime"),
    isBestNew: $reviewPage(".review__artwork--with-notch", reviewEl).length > 0,
    labels: $reviewPagee(".labels-list__item")
      .toArray()
      .map((label) => ({ name: $reviewPage(label).text() })),
    artists,
    genres: $reviewPage(".genre-list__item", reviewEl)
      .toArray()
      .map((genre) => ({ name: $reviewPage(genre).text() })),
    reviewHtml,
  };
}

export async function scrapeReviews(page: number) {
  console.log({ page });
  await setupSpotifyApi();

  const $ = await getPage(getReviewPageUrl(page));
  const reviewsHtml = $(".review");
  const reviews = await Promise.all(
    reviewsHtml.toArray().map((review) => parseReview($, review))
  );

  const reviewCreation = reviews.map((r) => ({
    ...r,
    labels: { create: r.labels.map((l) => ({ label: { create: l } })) },
    artists: { create: r.artists.map((a) => ({ artist: { create: a } })) },
    genres: { create: r.genres.map((g) => ({ genre: { create: g } })) },
  }));

  await Promise.all(
    reviewCreation.map(async (data) => {
      const review = await prisma.review.findFirst({
        where: {
          albumTitle: data.albumTitle,
          publishDate: data.publishDate,
        },
      });

      if (!review) {
        console.log(
          `Added: "${data.albumTitle}" by ${data.artists.create
            .map((a) => a.artist.create.name)
            .join(", ")}`,
          { hasSpotify: Boolean(data.spotifyAlbum) }
        );
        try {
          await prisma.review.create({
            data,
          });
        } catch (error) {
          console.log(data);
          throw error;
        }
      } else if (!review.spotifyAlbum && data.spotifyAlbum) {
        console.log(
          `Updated: "${data.albumTitle}" by ${data.artists.create
            .map((a) => a.artist.create.name)
            .join(", ")}`
        );
        await prisma.review.update({
          where: {
            id: review.id,
          },
          data: {
            spotifyAlbum: data.spotifyAlbum,
          },
        });
      }
    })
  );
}

export default async function scrapePitchfork(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await scrapeReviews(1);
  res.status(200).json(true);
}
