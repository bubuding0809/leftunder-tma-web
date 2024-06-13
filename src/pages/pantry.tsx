import MainLayout from "#/components/layouts/MainLayout";
import { TmaSDKLoader } from "#/components/layouts/TmaSdkLoader";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { NextPageWithLayout } from "#/pages/_app";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { useInitData } from "@tma.js/sdk-react";
import { CalendarDays, ChevronRight, ListFilter } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { useState } from "react";

// TODO: Replace with actual data
const totalFoodItems = "35";

// TODO: Replace with actual data
const categories = [
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
    name: "Grains",
    emoji: "🍚",
  },
  {
    name: "Frozen Food",
    emoji: "🍦",
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

const PantryPage: NextPageWithLayout = () => {
  const initData = useInitData(true);
  const [checkAll, setCheckAll] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  return (
    <div className="relative h-full max-h-screen overflow-y-auto">
      <div className="sticky top-0 z-10">
        <div
          className="rounded-b-3xl bg-cover bg-left-bottom bg-no-repeat px-4 pb-5 pt-8"
          style={{
            backgroundImage: `url(/assets/header_background.png)`,
          }}
        >
          <hgroup className="flex items-center justify-between text-white">
            <h1 className="text-2xl">{initData?.user?.username}'s Pantry</h1>
            <p>{totalFoodItems} items</p>
          </hgroup>
          <div className="mt-2 flex gap-x-2">
            <Input
              placeholder="Search Ingredients"
              className="text-[14px] placeholder:text-slate-400"
            />
            <Button size="icon" variant="outline" className="min-w-10">
              <ListFilter className="h-4 w-4" strokeWidth={3} />
            </Button>
          </div>
        </div>
        <div className=" bg-white">
          <ul className="flex space-x-1 overflow-x-auto p-4 pb-3">
            <li>
              <Button
                variant={categoryFilter.length ? "outline" : "default"}
                size="sm"
                className="border-none px-3 text-xs shadow"
                onClick={() => setCategoryFilter([])}
              >
                All
              </Button>
            </li>
            {categories.map((category, index) => (
              <li key={index}>
                <Button
                  variant={
                    categoryFilter.includes(category.name)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="border-none px-2 text-xs shadow-md"
                  onClick={() => {
                    setCategoryFilter((prev) => {
                      if (prev.includes(category.name)) {
                        return prev.filter((item) => item !== category.name);
                      }
                      return [...prev, category.name];
                    });
                  }}
                >
                  {`${category.emoji} ${category.name}`}
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex items-center space-x-2 px-4 pb-3">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Quick edit</Label>
          </div>
        </div>
        <Separator className="shadow" />
      </div>
      <ul className="flex flex-col space-y-3 p-4">
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
        <FoodItemCard />
      </ul>
    </div>
  );
};

const FoodItemCard = () => {
  return (
    <li className="flex rounded-md border bg-white p-4 shadow">
      <div className="relative flex h-min">
        <Avatar className="relative">
          <AvatarImage src="" />
          <AvatarFallback>🍎</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white bg-[#FD9F01]" />
      </div>

      <div className="ml-4 flex flex-1 flex-col space-y-1.5">
        <h2 className="">Farm Fresh Eggs</h2>
        <p className="text-xs font-light text-zinc-500">
          Tray of farm-fresh eggs.
        </p>
        <Badge
          variant="default"
          className="flex w-fit items-center rounded pl-2 text-xs font-normal text-white"
        >
          <CalendarDays className="h-4 w-4" strokeWidth={2} />
          <span className="ml-2 text-nowrap">21 Days Left</span>
        </Badge>
        <p className="text-xs text-zinc-500">
          <span>
            {categories.find((category) => category.name === "Dairy")?.emoji}{" "}
            Dairy
          </span>{" "}
          | <span>12 Units left</span>
        </p>
      </div>
      <Button size="icon" variant="outline" className="ml-4 rounded-full">
        <ChevronRight className="h-4 w-4" strokeWidth={2} />
      </Button>
    </li>
  );
};

PantryPage.getLayout = (page) => {
  return (
    <TmaSDKLoader>
      <MainLayout title="Pantry">{page}</MainLayout>
    </TmaSDKLoader>
  );
};

export default PantryPage;
