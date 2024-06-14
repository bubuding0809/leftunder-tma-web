import { createTRPCRouter } from "#/server/api/trpc";
import { getFilteredFoodItems } from "./getFilteredFoodItems";
import { getTotalFoodItemCount } from "./getTotalFoodItemCount";
import { updateConsumeStatus } from "./updateConsumeStatus";
import { updateDeleteStatus } from "./updateDeleteStatus";

export const foodItemRouter = createTRPCRouter({
  getFilteredFoodItems,
  getTotalFoodItemCount,
  updateConsumeStatus,
  updateDeleteStatus,
});
