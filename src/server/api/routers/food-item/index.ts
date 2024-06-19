import { createTRPCRouter } from "#/server/api/trpc";
import { getFilteredFoodItems } from "./getFilteredFoodItems";
import { getTotalFoodItemCount } from "./getTotalFoodItemCount";
import { updateConsumeStatus } from "./updateConsumeStatus";
import { updateDeleteStatus } from "./updateDeleteStatus";
import { updateFullFoodItemDetails } from "./updateFullFoodItemDetails";
import { updateManyFoodItemDetails } from "./updateManyFoodItemDetails";

export const foodItemRouter = createTRPCRouter({
  getFilteredFoodItems,
  getTotalFoodItemCount,
  updateConsumeStatus,
  updateDeleteStatus,
  updateManyFoodItemDetails,
  updateFullFoodItemDetails,
});
