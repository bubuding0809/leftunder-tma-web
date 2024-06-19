import { publicProcedure } from "#server/api/trpc";
import { detailsEditFormSchema } from "#/schema/food-item-schema";

const inputSchema = detailsEditFormSchema;

export const updateFullFoodItemDetails = publicProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    return await ctx.db.foodItem.update({
      where: { id: input.id },
      data: {
        name: input.name,
        category: input.category,
        description: input.description,
        expiry_date: input.expiryDate,
        storage_instructions: input.storageInstructions,
        quantity: input.quantity,
        unit: input.unit,
      },
    });
  });
