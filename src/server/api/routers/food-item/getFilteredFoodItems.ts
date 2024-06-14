import { z } from "zod";
import { publicProcedure } from "../../trpc";

const inputSchema = z.object({
  telegramUserId: z.number().optional(),
  search: z.string(),
  filters: z.object({
    category: z.array(z.string()),
  }),
  sort: z.object({
    field: z.string(),
    direction: z.union([z.literal("asc"), z.literal("desc")]),
  }),
  showConsumed: z.boolean().default(false),
  showDeleted: z.boolean().default(false),
});

export const getFilteredFoodItems = publicProcedure
  .input(inputSchema)
  .query(async ({ input, ctx }) => {
    const {
      telegramUserId,
      search,
      filters: { category },
      sort: { field, direction },
    } = input;

    return await ctx.db.foodItem.findMany({
      where: {
        User: {
          telegram_user_id: telegramUserId,
        },
        name: {
          contains: search,
          mode: "insensitive",
        },
        // Filter by consumed and discarded status
        AND: [
          {
            OR: [
              { consumed: { equals: false } },
              { consumed: { equals: input.showConsumed } },
            ],
          },
          {
            OR: [
              { discarded: { equals: false } },
              { discarded: { equals: input.showDeleted } },
            ],
          },
        ],
        // Filter by category if provided else return all
        category: category.length
          ? { in: category, mode: "insensitive" }
          : undefined,
      },
      orderBy: {
        [field]: direction,
      },
    });
  });
