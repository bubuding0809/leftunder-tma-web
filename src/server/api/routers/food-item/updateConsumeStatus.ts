import { publicProcedure } from "#/server/api/trpc";
import { z } from "zod";

const inputSchema = z.object({
  foodItemId: z.string(),
  consumed: z.boolean(),
});

export const updateConsumeStatus = publicProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    return await ctx.db.foodItem.update({
      where: {
        id: input.foodItemId,
      },
      data: {
        consumed: input.consumed,
      },
    });
  });
