import { z } from "zod";
import { publicProcedure } from "../../trpc";

const inputSchema = z.object({
  telegramUserId: z.number().optional(),
});
export const getTotalFoodItemCount = publicProcedure
  .input(inputSchema)
  .query(async ({ input, ctx }) => {
    return await ctx.db.foodItem.count({
      where: {
        User: {
          telegram_user_id: input.telegramUserId,
        },
        AND: [
          { discarded: { equals: false } },
          { consumed: { equals: false } },
        ],
      },
    });
  });
