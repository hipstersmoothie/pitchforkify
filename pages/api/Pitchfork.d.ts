export interface Genre {
  display_name: string;
  slug: string;
}

export interface Sizes {
  sm: string;
  m: string;
}

export interface Tout {
  width: number;
  height: number;
  credit: string;
  caption: string;
  altText: string;
  modelName: string;
  title: string;
  sizes: Sizes;
}

export interface Photos {
  tout: Tout;
  lede: boolean;
  social: boolean;
}

export interface Artist {
  id: string;
  display_name: string;
  url: string;
  genres: Genre[];
  slug: string;
  photos: Photos;
}

export interface Label {
  id: string;
  name: string;
  display_name: string;
}

export interface Sizes2 {
  list: string;
  standard: string;
  homepageSmall: string;
  homepageLarge: string;
}

export interface Tout2 {
  width: number;
  height: number;
  credit: string;
  caption: string;
  altText: string;
  title: string;
  sizes: Sizes2;
}

export interface Photos2 {
  tout: Tout2;
  lede: boolean;
  social: boolean;
}

export interface Album2 {
  artists: Artist[];
  display_name: string;
  labels: Label[];
  release_year: number;
  photos: Photos2;
}

export interface Rating {
  display_rating: string;
  rating: string;
  bnm: boolean;
  bnr: boolean;
}

export interface Label2 {
  id: string;
  name: string;
  display_name: string;
}

export interface LabelsAndYear {
  labels: Label2[];
  year: number;
}

export interface Album {
  id: string;
  album: Album2;
  rating: Rating;
  labels_and_years: LabelsAndYear[];
}

export interface Tombstone {
  bnm: boolean;
  bnr: boolean;
  albums: Album[];
}

export interface Genre2 {
  display_name: string;
  slug: string;
}

export interface Sizes3 {
  sm: string;
  m: string;
}

export interface Tout3 {
  width: number;
  height: number;
  credit: string;
  caption: string;
  altText: string;
  modelName: string;
  title: string;
  sizes: Sizes3;
}

export interface Photos3 {
  tout: Tout3;
  lede: boolean;
  social: boolean;
}

export interface Artist2 {
  id: string;
  display_name: string;
  url: string;
  genres: Genre2[];
  slug: string;
  photos: Photos3;
}

export interface Genre3 {
  display_name: string;
  slug: string;
}

export interface Author {
  name: string;
  url: string;
}

interface Image {
  aspectRatio: string;
  width: number;
  url: string;
  srcset: string;
}

export interface PitchforkReview {
  // artists: Artist2[];
  // genres: Genre3[];
  // channel: string;
  // subChannel: string;
  // position: number;
  // id: string;
  url: string;
  // contentType: string;
  // title: string;
  // seoTitle: string;
  // socialTitle: string;
  // promoTitle: string;
  // authors: Author[];
  pubDate: Date;
  // timestamp: number;
  // modifiedAt: Date;
  // dek: string;
  // seoDescription: string;
  // promoDescription: string;
  // socialDescription: string;
  // privateTags: string[];
  // tags: any[];
  subHed?: {
    name: string;
  };
  rubric?: {
    name: string;
  };
  image: {
    altText: string;
    sources: {
      sm: Image;
      lg: Image;
      xxl: Image;
    };
  };
  contributors: {
    author?: {
      items: Author[];
    };
  };
  ratingValue: {
    isBestNewMusic: boolean;
    isBestNewReissue: boolean;
    score: number;
    channelType: string;
  };
}
