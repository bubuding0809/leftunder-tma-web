import MainLayout from "#/components/layouts/MainLayout";
import { TmaSDKLoader } from "#/components/layouts/TmaSdkLoader";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { NextPageWithLayout, josefinSans } from "#/pages/_app";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { useClosingBehavior, useInitData } from "@tma.js/sdk-react";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronRight,
  ListFilter,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "#/components/ui/drawer";
import { cn } from "#/lib/utils";
import { api } from "#/utils/api";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "#/server/api/root";
import { match } from "ts-pattern";
import { differenceInHours, differenceInDays } from "date-fns";
import Spinner from "#/components/ui/spinner";
import useDebounce from "#/hooks/useDebounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import toast, { type Toast } from "react-hot-toast";
import { updateDeleteStatus } from "#/server/api/routers/food-item/updateDeleteStatus";

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
  const {
    debouncedValue: search,
    liveValue: liveSearch,
    setLiveValue: setLiveSearch,
  } = useDebounce({
    initialValue: "",
    delay: 250,
  });
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<
    inferRouterInputs<AppRouter>["foodItem"]["getFilteredFoodItems"]["sort"]
  >({
    field: "created_at",
    direction: "desc",
  });

  // TRPC query to get filtered food items
  const foodItemsQuery = api.foodItem.getFilteredFoodItems.useQuery(
    {
      telegramUserId: initData?.user?.id,
      search: search,
      filters: {
        category: categoryFilter,
      },
      sort: sort,
    },
    {
      enabled: !!initData?.user?.id,
    },
  );

  // TRPC query to get total food items count
  const { data: totalFoodItemCount } =
    api.foodItem.getTotalFoodItemCount.useQuery(
      {
        telegramUserId: initData?.user?.id,
      },
      {
        enabled: !!initData?.user?.id,
      },
    );

  const onSortChange = (value: string) => {
    const [field, direction] = value.split(":") as [string, "asc" | "desc"];
    setSort({ field, direction });
  };

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
            <p>{totalFoodItemCount} items</p>
          </hgroup>
          <div className="mt-2 flex gap-x-2">
            <Input
              placeholder="Search Ingredients"
              className="text-[14px] placeholder:text-slate-400"
              value={liveSearch}
              onChange={(e) => setLiveSearch(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="min-w-10">
                  <ArrowUpDown className="h-4 w-4" strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={`${sort.field}:${sort.direction}`}
                  onValueChange={onSortChange}
                >
                  <DropdownMenuRadioItem value="created_at:desc">
                    ✍️ Created (newest)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="created_at:asc">
                    ✍️ Created (oldest)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="expiry_date:desc">
                    ⏳ expirying (latest)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="expiry_date:asc">
                    ⏳ expirying (soonest)
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="bg-white">
          <ul className="flex space-x-1 overflow-x-auto p-4 pb-2">
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

          <div className="flex items-center justify-between px-4 pb-3 pt-2 text-sm">
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" />
              <Label htmlFor="airplane-mode">Quick edit</Label>
            </div>
            <div>
              Showing {foodItemsQuery.data?.length} of {totalFoodItemCount}{" "}
              items
            </div>
          </div>
        </div>
        <Separator className="shadow" />
      </div>
      {match(foodItemsQuery)
        .with(
          {
            status: "success",
          },
          ({ data }) => <FoodItemsList foodItems={data} />,
        )
        .with(
          {
            status: "pending",
          },
          () => <FoodItemsLoading />,
        )
        .with(
          {
            status: "error",
          },
          ({ error }) => <FoodItemsError errorMessage={error.message} />,
        )
        .exhaustive()}
    </div>
  );
};

interface FoodItemsListProps {
  foodItems: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"];
}
const FoodItemsList = ({ foodItems }: FoodItemsListProps) => {
  return (
    <ul className="flex flex-col space-y-3 p-4">
      {foodItems.map((foodItem) => (
        <FoodItemCard key={foodItem.id} foodItem={foodItem} />
      ))}

      {foodItems.length === 0 && <FoodItemsEmpty />}
    </ul>
  );
};

const FoodItemsLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <Spinner className="h-12 w-12" />
      <p className="mt-2 text-center text-lg font-semibold text-primary">
        Loading your pantry...
      </p>
    </div>
  );
};

const FoodItemsError = ({ errorMessage }: { errorMessage: string }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <span className="text-5xl">💩</span>
      <p className="mt-2 text-center text-lg font-semibold text-red-500">
        Something went wrong
      </p>
      <span className="mt-2 text-center text-sm text-gray-500">
        {errorMessage}
      </span>
    </div>
  );
};

const FoodItemsEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <span className="text-5xl">🤷‍♂️</span>
      <p className="mt-2 text-center text-lg font-semibold text-amber-600">
        Nothing found
      </p>
      <span className="mt-2 text-center text-sm text-gray-500">
        Try searching for something else or adjust your filters
      </span>
    </div>
  );
};

interface FoodItemCardProps {
  foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0];
}
const FoodItemCard = ({ foodItem }: FoodItemCardProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Consider food as newly added if it was added in the last 12 hours
  const isNewlyAdded =
    Math.abs(differenceInHours(new Date(), new Date(foodItem.created_at))) < 12;

  // Calculate time to expiry
  const timeToExpiry = useMemo(() => {
    const daysLeft = differenceInDays(
      new Date(foodItem.expiry_date!),
      new Date(),
    );

    const suffix = daysLeft > 0 ? "Left" : "Expired";
    const absDaysLeft = Math.abs(daysLeft);

    // Return days if expiry date is less than 7 days
    if (absDaysLeft < 7) {
      return `${absDaysLeft} Days ${suffix}`;
    }

    // Return weeks if expiry date is less than 30 days
    if (absDaysLeft < 30) {
      return `${Math.floor(absDaysLeft / 7)} Weeks ${suffix}`;
    }

    // Return months if expiry date is less than 365 days
    if (absDaysLeft < 365) {
      return `${Math.floor(absDaysLeft / 30)} Months ${suffix}`;
    }

    // Return years if expiry date is more than 365 days
    return `${Math.floor(absDaysLeft / 365)} Years ${suffix}`;
  }, [foodItem.expiry_date]);

  // Color code time to expiry
  const timeToExpiryColor = useMemo(() => {
    const daysLeft = differenceInDays(
      new Date(foodItem.expiry_date!),
      new Date(),
    );

    return match(daysLeft)
      .when(
        (days) => days < 0,
        () => "bg-red-600",
      )
      .when(
        (days) => days < 7,
        () => "bg-yellow-600",
      )
      .otherwise(() => "bg-green-600");
  }, [timeToExpiry]);

  return (
    <li className="flex rounded-md border bg-white p-4 shadow">
      <div className="relative flex h-min">
        <Avatar className="relative">
          <AvatarImage src={foodItem?.image_url ?? ""} />
          <AvatarFallback>
            {
              categories.find((category) => category.name === foodItem.category)
                ?.emoji
            }
          </AvatarFallback>
        </Avatar>
        {isNewlyAdded && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white bg-[#FD9F01]" />
        )}
      </div>

      <div className="ml-4 flex flex-1 flex-col space-y-1.5">
        <h2 className="text-sm font-semibold">{foodItem.name}</h2>
        <p className="line-clamp-2 text-xs font-light text-zinc-500">
          {foodItem.description}
        </p>
        <Badge
          variant="default"
          className={cn(
            "flex w-fit items-center rounded pl-2 text-xs font-normal text-white",
            timeToExpiryColor,
          )}
        >
          <CalendarDays className="h-4 w-4" strokeWidth={2} />
          <span className="ml-2 text-nowrap">{timeToExpiry}</span>
        </Badge>
        <p className="text-xs text-zinc-500">
          <span>
            {
              categories.find((category) => category.name === foodItem.category)
                ?.emoji
            }{" "}
            {foodItem.category}
          </span>{" "}
          |{" "}
          <span>
            {foodItem.quantity.toString()} {foodItem.unit} left
          </span>
        </p>
      </div>

      <FoodItemDetails
        open={isDrawerOpen}
        setOpen={setIsDrawerOpen}
        foodItem={foodItem}
        timeToExpiry={timeToExpiry}
        timeToExpiryColor={timeToExpiryColor}
        isNewlyAdded={isNewlyAdded}
      />
    </li>
  );
};

interface FoodItemDetailsProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0];
  isNewlyAdded: boolean;
  timeToExpiry: string;
  timeToExpiryColor: string;
}
const FoodItemDetails = ({
  open,
  setOpen,
  foodItem,
  isNewlyAdded,
  timeToExpiry,
  timeToExpiryColor,
}: FoodItemDetailsProps) => {
  const tmaClosingBehavior = useClosingBehavior(true);

  // Enable confirmation dialog when closing the drawer to prevent accidental closing
  useEffect(() => {
    if (open) {
      tmaClosingBehavior?.enableConfirmation();
    } else {
      tmaClosingBehavior?.disableConfirmation();
    }
  }, [open]);

  // TRPC utils to access query context
  const queryClient = api.useUtils();

  // TRPC mutation to mark food item as consumed and deleted
  const markFoodItemAsConsumedMutation =
    api.foodItem.markFoodItemAsConsumed.useMutation({
      onSuccess: () => {
        setOpen(false);
        queryClient.foodItem.getFilteredFoodItems.invalidate();
        queryClient.foodItem.getTotalFoodItemCount.invalidate();
      },
    });
  const updateFoodItemDeletestatus =
    api.foodItem.updateDeleteStatus.useMutation({
      onSuccess: () => {
        setOpen(false);
        queryClient.foodItem.getFilteredFoodItems.invalidate();
        queryClient.foodItem.getTotalFoodItemCount.invalidate();
      },
    });

  const onSendToast = (
    message: string,
    onAction: (t: Toast) => void,
    actionLabel: string,
  ) => {
    toast(
      (t) => (
        <span className="text-xs font-medium">
          {message}
          <Button
            className="ml-4 text-xs"
            text-xs
            size="icon"
            variant="link"
            onClick={() => onAction(t)}
          >
            {actionLabel}
          </Button>
        </span>
      ),
      {
        duration: 3000,
      },
    );
  };

  const onConsumeFoodItem = () => {
    markFoodItemAsConsumedMutation.mutate({ foodItemId: foodItem.id });
  };

  const onDeleteFoodItem = () => {
    updateFoodItemDeletestatus.mutate(
      {
        foodItemId: foodItem.id,
        deleted: true,
      },
      {
        onSuccess: () => {
          // Show toast notification to allow user to undo the action
          onSendToast(
            "Food item deleted successfully",
            (t) =>
              updateFoodItemDeletestatus
                .mutateAsync({
                  foodItemId: foodItem.id,
                  deleted: false,
                })
                .then(() => toast.dismiss(t.id)),
            "Undo",
          );
        },
      },
    );
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="icon" variant="outline" className="ml-4 rounded-full">
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className={cn(josefinSans.className)}>
        <div className="flex p-6">
          <div className="relative flex h-min">
            <Avatar className="relative">
              <AvatarImage src={foodItem?.image_url ?? ""} />
              <AvatarFallback>
                {
                  categories.find(
                    (category) => category.name === foodItem.category,
                  )?.emoji
                }
              </AvatarFallback>
            </Avatar>
            {isNewlyAdded && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white bg-[#FD9F01]" />
            )}
          </div>

          <div className="ml-4 flex flex-1 flex-col space-y-1.5">
            <h2 className="text-sm font-semibold">{foodItem.name}</h2>
            <p className="line-clamp-2 text-xs font-light text-zinc-500">
              {foodItem.description}
            </p>
            <Badge
              variant="default"
              className={cn(
                "flex w-fit items-center rounded pl-2 text-xs font-normal text-white",
                timeToExpiryColor,
              )}
            >
              <CalendarDays className="h-4 w-4" strokeWidth={2} />
              <span className="ml-2 text-nowrap">{timeToExpiry}</span>
            </Badge>
            <p className="text-xs text-zinc-500">
              <span>
                {
                  categories.find(
                    (category) => category.name === foodItem.category,
                  )?.emoji
                }{" "}
                {foodItem.category}
              </span>{" "}
              |{" "}
              <span>
                {foodItem.quantity.toString()} {foodItem.unit} left
              </span>
            </p>
            <div className="flex flex-col space-y-2 pt-3 text-xs">
              <p className="flex flex-col">
                <span className="font-semibold">🗄️ Storage Instructions</span>
                <span className="mt-1 font-light">
                  {foodItem.storage_instructions}
                </span>
              </p>
            </div>
          </div>
        </div>
        <Separator />
        <DrawerFooter>
          <Button
            onClick={() => onConsumeFoodItem()}
            disabled={markFoodItemAsConsumedMutation.isPending}
          >
            <span className="mr-1">
              {markFoodItemAsConsumedMutation.isPending ? <Spinner /> : "✅"}
            </span>
            Mark as consumed
          </Button>
          <Button
            variant="outline"
            className="text-red-600"
            onClick={() => onDeleteFoodItem()}
            disabled={updateFoodItemDeletestatus.isPending}
          >
            <span className="mr-1">
              {updateFoodItemDeletestatus.isPending ? <Spinner /> : "❌"}
            </span>
            Delete
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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
