import { z } from "zod";

export const foodItemFormSchema = z.object({
  id: z.string(),
  expiryDate: z.date(),
  category: z.string(),
  quantity: z.number(),
  unit: z.string(),
  consumed: z.boolean(),
});
