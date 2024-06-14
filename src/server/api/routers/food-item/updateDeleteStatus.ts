import { publicProcedure } from "#/server/api/trpc";
import { z } from "zod";

const inputSchema = z.object({
  foodItemId: z.string(),
  deleted: z.boolean(),
});

export const updateDeleteStatus = publicProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    return await ctx.db.foodItem.update({
      where: {
        id: input.foodItemId,
      },
      data: {
        discarded: input.deleted,
      },
    });
  });
