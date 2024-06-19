import { z } from "zod";

// TODO: Replace with actual data
export const categories = [
  {
    name: "Fruits",
    emoji: "🍎",
  },
  {
    name: "Vegetables",
    emoji: "🥦",
  },
  {
    name: "Meat",
    emoji: "🍖",
  },
  {
    name: "Dairy",
    emoji: "🧀",
  },
  {
    name: "Snacks",
    emoji: "🍿",
  },
  {
    name: "Beverages",
    emoji: "🥤",
  },
  {
    name: "Condiments",
    emoji: "🍯",
  },
  {
    name: "Grains",
    emoji: "🍚",
  },
  {
    name: "Frozen Food",
    emoji: "🧊",
  },
  {
    name: "Canned Food",
    emoji: "🥫",
  },
  {
    name: "Pastries",
    emoji: "🍩",
  },
  {
    name: "Cooked Food",
    emoji: "🍲",
  },
  {
    name: "Others",
    emoji: "🍴",
  },
];

// TODO: Replace with actual data
export const units = [
  "g",
  "ml",
  "oz",
  "l",
  "kg",
  "piece",
  "packet",
  "bottle",
  "cup",
  "can",
  "box",
  "jar",
  "container",
  "bowl",
  "carton",
  "serving",
  "others",
];

export const foodItemFormSchema = z.object({
  id: z.string().min(1),
  expiryDate: z.date(),
  category: z.string().min(1, "Category is required"),
  quantity: z.string().refine(
    (value) => {
      if (value === "") return false;
      return !isNaN(Number(value));
    },
    {
      message: "Quantity must be a number",
    },
  ),
  unit: z.string().min(1, "Unit is required"),
  consumed: z.boolean(),
});

export const detailsEditFormSchema = foodItemFormSchema.extend({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  storageInstructions: z.string().min(1, "Storage Instructions is required"),
});
