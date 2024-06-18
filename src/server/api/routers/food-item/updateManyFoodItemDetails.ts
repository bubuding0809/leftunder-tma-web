import { foodItemFormSchema } from "#/schema/food-item-schema";
import { publicProcedure } from "#/server/api/trpc";
import { z } from "zod";

const inputSchema = z.object({
  foodItems: z.array(foodItemFormSchema),
});

export const updateManyFoodItemDetails = publicProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    // Create a transaction to update all food items in a single transaction
    return await ctx.db.$transaction(
      input.foodItems.map((foodItem) =>
        ctx.db.foodItem.update({
          where: { id: foodItem.id },
          data: {
            expiry_date: foodItem.expiryDate,
            category: foodItem.category,
            quantity: foodItem.quantity,
            unit: foodItem.unit,
            consumed: foodItem.consumed,
          },
        }),
      ),
    );
  });
