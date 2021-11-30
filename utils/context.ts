import { createContext } from "react";
import { Review } from "../pages/api/reviews";

export const ReviewsContext = createContext<{
  randomReview?: Review;
  setRandomReview: (reviews: Review) => void;
  reviews: Review[];
  setAllReviews: (reviews: Review[]) => void;
}>({
  reviews: [],
  setRandomReview: () => undefined,
  setAllReviews: () => undefined,
});

export const FavoritesContext = createContext<{ favorites: string[] }>({
  favorites: [],
});
