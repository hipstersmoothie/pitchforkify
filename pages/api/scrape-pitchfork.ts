import type { NextApiRequest, NextApiResponse } from "next";
import cheerio, { CheerioAPI, Element } from "cheerio";
import fetch from "isomorphic-fetch";
import SpotifyWebApi from "spotify-web-api-node";
import prisma from "../../utils/primsa";

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

async function parseReview($: CheerioAPI, el: Element) {
  const $reviewPage = await getPage(
    `${rootUrl}${$(".review__link", el).attr("href")}`
  );
  const albumTitle = $(".review__title-album", el).text();
  const artists = $(".review__title-artist li", el)
    .toArray()
    .map((artist) => ({ name: $(artist).text() }));

  const {
    body: {
      albums: { items },
    },
  } = await spotifyApi.search(
    `${artists[0].name} ${albumTitle.replace("EP", "")}`,
    ["album"]
  );

  return {
    albumTitle: $(".review__title-album", el).text(),
    cover: $(".review__artwork img", el).attr("src"),
    spotifyAlbum: items[0].uri || null,
    score: Number($reviewPage(".score").text()),
    publishDate: $(".pub-date", el).attr("datetime"),
    isBestNew: $(".review__artwork--with-notch", el).length > 0,
    labels: $reviewPage(".labels-list__item")
      .toArray()
      .map((label) => ({ name: $(label).text() })),
    artists,
    genres: $(".genre-list__item", el)
      .toArray()
      .map((genre) => ({ name: $(genre).text() })),
    reviewHtml: $reviewPage(".review-detail__article-content").html(),
  };
}


export async function scrapeReviews(page: number) {
  await setupSpotifyApi();

  const $ = await getPage(getReviewPageUrl(page));
  const reviewsHtml = $(".review");
  const reviews = await Promise.all(
    reviewsHtml.toArray().map((review) => parseReview($, review))
  );

  return reviews;
}

export default async function scrapePitchfork(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reviews = await scrapeReviews(1);
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
        await prisma.review.create({
          data,
        });
      }
    })
  );

  res.status(200).json(true);
}
