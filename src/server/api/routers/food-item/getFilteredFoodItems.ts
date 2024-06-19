import { z } from "zod";
import { publicProcedure } from "../../trpc";

export const inputSchema = z.object({
  telegramUserId: z.number().optional(),
  search: z.string(),
  filters: z.object({
    category: z.array(z.string()),
    status: z.union([
      z.literal("active"),
      z.literal("consumed"),
      z.literal("expired"),
    ]),
  }),
  sort: z.object({
    field: z.string(),
    direction: z.union([z.literal("asc"), z.literal("desc")]),
  }),
});

export const getFilteredFoodItems = publicProcedure
  .input(inputSchema)
  .query(async ({ input, ctx }) => {
    const {
      telegramUserId,
      search,
      filters: { category, status },
      sort: { field, direction },
    } = input;

    // For active case show only items that are not consumed and not expired
    const statusFilter = {
      active: {
        AND: [
          { consumed: { equals: false } },
          { expiry_date: { gte: new Date() } },
        ],
      },
      consumed: {
        consumed: { equals: true },
      },
      expired: {
        expiry_date: { lt: new Date() },
      },
    };

    return await ctx.db.foodItem.findMany({
      where: {
        User: {
          telegram_user_id: telegramUserId,
        },
        name: {
          contains: search,
          mode: "insensitive",
        },
        discarded: { equals: false },
        category: category.length
          ? { in: category, mode: "insensitive" }
          : undefined,
        ...statusFilter[status],
      },
      orderBy: [
        {
          [field]: direction,
        },
        {
          name: "asc",
        },
      ],
    });
  });
