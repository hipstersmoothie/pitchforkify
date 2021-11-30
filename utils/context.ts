import { createContext } from "react";
import { Review } from "../pages/api/reviews";

export const ReviewsContext = createContext<{
  reviews: Review[];
  setAllReviews: (reviews: Review[]) => void;
}>({
  reviews: [],
  setAllReviews: () => undefined,
});

export const FavoritesContext = createContext<{ favorites: string[] }>({
  favorites: [],
});
