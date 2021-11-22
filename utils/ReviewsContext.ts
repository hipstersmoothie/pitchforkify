import { createContext } from "react";
import { Review } from "../pages/api/reviews";

export const ReviewsContext = createContext<{ reviews: Review[] }>({ reviews: [] });
