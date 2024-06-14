import { createTRPCRouter } from "#/server/api/trpc";
import { getFilteredFoodItems } from "./getFilteredFoodItems";
import { getTotalFoodItemCount } from "./getTotalFoodItemCount";
import { markFoodItemAsConsumed } from "./markFoodItemAsConsumed";
import { updateDeleteStatus } from "./updateDeleteStatus";

export const foodItemRouter = createTRPCRouter({
  getFilteredFoodItems,
  getTotalFoodItemCount,
  markFoodItemAsConsumed,
  updateDeleteStatus,
});
