import type { NextApiRequest, NextApiResponse } from "next";
import cheerio, { CheerioAPI, Element } from "cheerio";
import fetch from "isomorphic-fetch";
import SpotifyWebApi from "spotify-web-api-node";

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
    .map((artist) => $(artist).text());

  const {
    body: {
      albums: { items },
    },
  } = await spotifyApi.search(`${artists[0]} ${albumTitle.replace("EP", "")}`, [
    "album",
  ]);

  return {
    albumTitle: $(".review__title-album", el).text(),
    cover: $(".review__artwork img", el).attr("src"),
    spotifyAlbum: items[0] || null,
    score: $reviewPage(".score").text(),
    publishDate: $(".pub-date", el).attr('datetime'),
    isBestNew: $('.review__artwork--with-notch', el).length > 0,
    labels: $reviewPage(".labels-list__item")
      .toArray()
      .map((label) => $(label).text()),
    artists,
    genres: $(".genre-list__item", el)
      .toArray()
      .map((genre) => $(genre).text()),
    reviewHtml: $reviewPage(".review-detail__article-content").html(),
  };
}

type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export type Review = UnPromisify<ReturnType<typeof parseReview>>;

export async function scrapeReviews(page: number) {
  await setupSpotifyApi();

  const $ = await getPage(getReviewPageUrl(page));
  const reviewsHtml = $(".review");
  const reviews = await Promise.all(
    reviewsHtml.toArray().map((review) => parseReview($, review))
  );

  return reviews;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const reviews = await scrapeReviews(1);
  res.status(200).json(reviews);
};
