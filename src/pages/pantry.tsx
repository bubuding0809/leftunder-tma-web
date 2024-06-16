import MainLayout from "#/components/layouts/MainLayout";
import { TmaSDKLoader } from "#/components/layouts/TmaSdkLoader";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { NextPageWithLayout, josefinSans } from "#/pages/_app";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
  useClosingBehavior,
  useInitData,
  useMainButton,
  usePopup,
} from "@tma.js/sdk-react";
import {
  postEvent,
  on as onTmaEvent,
  off as offTmaEvent,
  type MiniAppsEventListener,
} from "@tma.js/sdk";
import {
  ArrowUpDown,
  CalendarDays,
  CalendarIcon,
  ChevronRight,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "#/components/ui/drawer";
import { cn } from "#/lib/utils";
import { api } from "#/utils/api";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "#/server/api/root";
import { match } from "ts-pattern";
import { differenceInHours, differenceInDays, format, set } from "date-fns";
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
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
  Type,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";
import { Checkbox } from "#/components/ui/checkbox";
import { Calendar } from "#/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useForm } from "react-hook-form";
import { z } from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "#/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

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
    name: "Condiments",
    emoji: "🍯",
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

// TODO: Replace with actual data
const units = [
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

const PantryPage: NextPageWithLayout = () => {
  const initData = useInitData(true);
  const tmaClosingBehavior = useClosingBehavior(true);
  const tmaMainButton = useMainButton(true);
  const tmaPopup = usePopup(true);

  // Enable confirmation dialog when closing the drawer to prevent accidental closing
  useEffect(() => {
    tmaClosingBehavior?.enableConfirmation();
    return () => {
      tmaClosingBehavior?.disableConfirmation();
    };
  }, [tmaClosingBehavior]);

  // Hide main button on mount
  useEffect(() => {
    tmaMainButton?.hide();
  }, [tmaMainButton]);

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
  const [editable, setEditable] = useState(false);

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
    postEvent("web_app_trigger_haptic_feedback", {
      type: "notification",
      notification_type: "success",
    });

    const [field, direction] = value.split(":") as [string, "asc" | "desc"];
    setSort({ field, direction });
  };

  const onQuickEditToggle = (checked: boolean) => {
    postEvent("web_app_trigger_haptic_feedback", {
      type: "notification",
      notification_type: "success",
    });

    if (checked) {
      // Enable main button for saving changes
      tmaMainButton?.setParams({
        bgColor: "#1C5638",
        text: "Save changes",
        isEnabled: true,
        isVisible: true,
      });

      // Enable save changes button on main button click
      const onMainButtonClicked = () => {
        // TODO Save changes made to food items
        console.log("Saving changes...");

        // Disable quick edit mode after saving changes
        setEditable(false);
        tmaMainButton?.setParams({
          text: "",
          isEnabled: false,
          isVisible: false,
        });
        tmaMainButton?.hide();

        // unregister event listener after main button is clicked
        tmaMainButton?.off("click", onMainButtonClicked);
      };
      tmaMainButton?.on("click", onMainButtonClicked);

      setEditable(true);
    } else {
      // Ask if user wants to discard changes when quick edit is disabled
      const onPopupClosed: MiniAppsEventListener<"popup_closed"> = ({
        button_id,
      }) => {
        if (button_id === "cancel") return;
        if (button_id === "ok") {
          setEditable(false);
          tmaMainButton?.setParams({
            text: "",
            isEnabled: false,
            isVisible: false,
          });
          tmaMainButton?.hide();
        }

        // unregister event listener after popup is closed
        offTmaEvent("popup_closed", onPopupClosed);
      };
      onTmaEvent("popup_closed", onPopupClosed);

      tmaPopup?.open({
        title: "🫸 Discard changes?",
        message: "Unsaved changes will be lost. Are you sure?",
        buttons: [
          {
            type: "ok",
            id: "ok",
          },
          {
            type: "cancel",
            id: "cancel",
          },
        ],
      });
    }
  };

  return (
    <div className="relative">
      <div className="sticky top-0 z-10 bg-white">
        <div
          className="rounded-b-3xl bg-cover bg-left-bottom bg-no-repeat px-4 pb-5 pt-8"
          style={{
            backgroundImage: `url(/assets/header_background.png)`,
          }}
        >
          <hgroup className="flex items-center justify-between text-white">
            <h1 className="text-2xl">
              {initData?.user?.username ?? "User"}'s Pantry
            </h1>
            <p>{totalFoodItemCount} items</p>
          </hgroup>
          <div className="mt-2 flex gap-x-2">
            <Input
              placeholder="🔍 Search by food name"
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
                    Newest first
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="created_at:asc">
                    ✍️ Oldest first
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="expiry_date:desc">
                    ⌛️ Expiring soon
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="expiry_date:asc">
                    ⏳ Expiring last
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
                onClick={() => {
                  postEvent("web_app_trigger_haptic_feedback", {
                    type: "notification",
                    notification_type: "success",
                  });
                  setCategoryFilter([]);
                }}
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
                    postEvent("web_app_trigger_haptic_feedback", {
                      type: "notification",
                      notification_type: "success",
                    });
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
              <Switch
                id="airplane-mode"
                checked={editable}
                onCheckedChange={onQuickEditToggle}
              />
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
          ({ data }) => <FoodItemsList foodItems={data} editable={editable} />,
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

const onSendToast = (
  message: string,
  actionLabel: string,
  duration: number = 3000,
  onAction: (t: Toast) => void,
) => {
  toast(
    (t) => (
      <span className="text-xs font-medium">
        {message}
        <Button
          type="button"
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
      duration: duration,
      icon: "🚨",
      position: "top-right",
    },
  );
};

interface FoodItemsListProps {
  foodItems: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"];
  editable: boolean;
}
const FoodItemsList = ({ foodItems, editable }: FoodItemsListProps) => {
  const queryClient = api.useUtils();
  const updateConsumeStatusMutation =
    api.foodItem.updateConsumeStatus.useMutation({
      onSuccess: () => {
        queryClient.foodItem.getFilteredFoodItems.invalidate();
        queryClient.foodItem.getTotalFoodItemCount.invalidate();
      },
    });
  const updateDeleteStatusMutation =
    api.foodItem.updateDeleteStatus.useMutation({
      onSuccess: () => {
        queryClient.foodItem.getFilteredFoodItems.invalidate();
        queryClient.foodItem.getTotalFoodItemCount.invalidate();
      },
    });

  const deleteItemAction = (foodItemId: string) => {
    return (
      <TrailingActions>
        {/* Mark food as deleted */}
        <SwipeAction
          destructive={true}
          onClick={() => {
            postEvent("web_app_trigger_haptic_feedback", {
              type: "notification",
              notification_type: "success",
            });
            updateDeleteStatusMutation.mutate(
              { foodItemId, deleted: true },
              {
                onSuccess: () => {
                  // Show toast notification to allow user to undo the action
                  onSendToast(
                    "Food item deleted successfully",
                    "Undo",
                    3000,
                    (t) => {
                      postEvent("web_app_trigger_haptic_feedback", {
                        type: "notification",
                        notification_type: "success",
                      });
                      updateDeleteStatusMutation
                        .mutateAsync({
                          foodItemId: foodItemId,
                          deleted: false,
                        })
                        .then(() => toast.dismiss(t.id));
                    },
                  );
                },
              },
            );
          }}
        >
          <div className="flex items-center bg-destructive px-5">
            <span className="text-md w-max text-white">🗑️</span>
          </div>
        </SwipeAction>

        {/* Mark food as consumed */}
        <SwipeAction
          destructive={true}
          onClick={() => {
            postEvent("web_app_trigger_haptic_feedback", {
              type: "notification",
              notification_type: "success",
            });
            updateConsumeStatusMutation.mutate(
              { foodItemId, consumed: true },
              {
                onSuccess: () => {
                  // Show toast notification to allow user to undo the action
                  onSendToast(
                    "Food item marked as consumed",
                    "Undo",
                    3000,
                    (t) => {
                      postEvent("web_app_trigger_haptic_feedback", {
                        type: "notification",
                        notification_type: "success",
                      });
                      updateConsumeStatusMutation
                        .mutateAsync({
                          foodItemId: foodItemId,
                          consumed: false,
                        })
                        .then(() => toast.dismiss(t.id));
                    },
                  );
                },
              },
            );
          }}
        >
          <div className="flex items-center rounded-r-md bg-primary px-5">
            <span className="text-md w-max text-white">✅</span>
          </div>
        </SwipeAction>
      </TrailingActions>
    );
  };

  return (
    <>
      {editable && foodItems.length > 0 && (
        <ul className="flex flex-col space-y-3 p-4">
          {foodItems.map((foodItem) => (
            <li
              key={foodItem.id}
              className="flex w-full rounded-md border bg-white p-4 shadow"
            >
              <FoodItemEditCard foodItem={foodItem} />
            </li>
          ))}
        </ul>
      )}

      {!editable && foodItems.length > 0 && (
        <SwipeableList
          className="space-y-3 p-4"
          type={Type.IOS}
          destructiveCallbackDelay={100}
        >
          {foodItems.map((foodItem) => (
            <SwipeableListItem
              key={foodItem.id}
              trailingActions={deleteItemAction(foodItem.id)}
              className="flex w-full rounded-md border bg-white p-4 shadow"
            >
              <FoodItemCard foodItem={foodItem} />
            </SwipeableListItem>
          ))}
        </SwipeableList>
      )}

      {foodItems.length === 0 && <FoodItemsEmpty />}
    </>
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
    const absDayDelta = Math.abs(daysLeft);

    if (absDayDelta === 0) {
      return "Expiring Today";
    }

    if (absDayDelta === 1) {
      return `1 Day ${suffix}`;
    }

    // Return days if expiry date is less than 7 days
    if (absDayDelta < 7) {
      return `${absDayDelta} Days ${suffix}`;
    }

    // Return weeks if expiry date is less than 30 days
    if (absDayDelta < 30) {
      return `${Math.floor(absDayDelta / 7)} Weeks ${suffix}`;
    }

    // Return months if expiry date is less than 365 days
    if (absDayDelta < 365) {
      return `${Math.floor(absDayDelta / 30)} Months ${suffix}`;
    }

    // Return years if expiry date is more than 365 days
    return `${Math.floor(absDayDelta / 365)} Years ${suffix}`;
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
    <>
      <div className="relative flex h-min self-start">
        <Avatar className="relative">
          <AvatarImage src={foodItem?.image_url ?? ""} />
          <AvatarFallback>
            {
              categories.find((category) => category.name === foodItem.category)
                ?.emoji
            }
          </AvatarFallback>
        </Avatar>
        {/* {isNewlyAdded && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white bg-[#FD9F01]" />
        )} */}
      </div>

      <div className="ml-4 flex flex-1 flex-col space-y-1.5 self-start">
        <h2 className="text-sm font-semibold">{foodItem.name}</h2>
        <p className="line-clamp-2 text-xs font-light text-zinc-700">
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
    </>
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
  // TRPC utils to access query context
  const queryClient = api.useUtils();

  // TRPC mutation to mark food item as consumed and deleted
  const updateConsumeStatusMutation =
    api.foodItem.updateConsumeStatus.useMutation({
      onSuccess: () => {
        setOpen(false);
        queryClient.foodItem.getFilteredFoodItems.invalidate();
        queryClient.foodItem.getTotalFoodItemCount.invalidate();
      },
    });
  const updateDeleteStatusMutation =
    api.foodItem.updateDeleteStatus.useMutation({
      onSuccess: () => {
        setOpen(false);
        queryClient.foodItem.getFilteredFoodItems.invalidate();
        queryClient.foodItem.getTotalFoodItemCount.invalidate();
      },
    });

  const onConsumeFoodItem = () => {
    postEvent("web_app_trigger_haptic_feedback", {
      type: "notification",
      notification_type: "success",
    });
    updateConsumeStatusMutation.mutate(
      { foodItemId: foodItem.id, consumed: true },
      {
        onSuccess: () => {
          // Show toast notification to allow user to undo the action
          onSendToast("Food item marked as consumed", "Undo", 3000, (t) => {
            postEvent("web_app_trigger_haptic_feedback", {
              type: "notification",
              notification_type: "success",
            });
            updateConsumeStatusMutation
              .mutateAsync({ foodItemId: foodItem.id, consumed: false })
              .then(() => toast.dismiss(t.id));
          });
        },
      },
    );
  };

  const onDeleteFoodItem = () => {
    postEvent("web_app_trigger_haptic_feedback", {
      type: "notification",
      notification_type: "success",
    });
    updateDeleteStatusMutation.mutate(
      {
        foodItemId: foodItem.id,
        deleted: true,
      },
      {
        onSuccess: () => {
          // Show toast notification to allow user to undo the action
          onSendToast("Food item deleted successfully", "Undo", 3000, (t) => {
            postEvent("web_app_trigger_haptic_feedback", {
              type: "notification",
              notification_type: "success",
            });
            updateDeleteStatusMutation
              .mutateAsync({
                foodItemId: foodItem.id,
                deleted: false,
              })
              .then(() => toast.dismiss(t.id));
          });
        },
      },
    );
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="ml-4 self-start rounded-full"
        >
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
            <p className="line-clamp-2 text-xs font-light text-zinc-700">
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
            disabled={updateConsumeStatusMutation.isPending}
          >
            <span className="mr-1">
              {updateConsumeStatusMutation.isPending ? <Spinner /> : "✅"}
            </span>
            Consumed
          </Button>
          <Button
            variant="outline"
            className="text-red-600"
            onClick={() => onDeleteFoodItem()}
            disabled={updateDeleteStatusMutation.isPending}
          >
            <span className="mr-1">
              {updateDeleteStatusMutation.isPending ? <Spinner /> : "❌"}
            </span>
            Delete
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const foodItemFormSchema = z.object({
  expiryDate: z.date(),
  category: z.string(),
  quantity: z.number(),
  unit: z.string(),
});

interface FoodItemEditCardProps {
  foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0];
}
const FoodItemEditCard = ({ foodItem }: FoodItemEditCardProps) => {
  // Consider food as newly added if it was added in the last 12 hours
  const isNewlyAdded =
    Math.abs(differenceInHours(new Date(), new Date(foodItem.created_at))) < 12;

  const form = useForm<z.infer<typeof foodItemFormSchema>>({
    resolver: zodResolver(foodItemFormSchema),
    defaultValues: {
      expiryDate: new Date(foodItem.expiry_date ?? ""),
      category: foodItem.category,
      quantity: parseInt(foodItem.quantity.toString()),
      unit: foodItem.unit,
    },
  });

  return (
    <>
      <div className="relative flex h-min self-start">
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

      <div className="ml-4 flex flex-1 flex-col space-y-1.5 self-start">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{foodItem.name}</h2>
          <div className="flex items-center space-x-1">
            <label
              htmlFor="check-consumed"
              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Consumed
            </label>
            <Checkbox id="check-consumed" />
          </div>
        </div>
        <p className="line-clamp-2 text-xs font-light text-zinc-700">
          {foodItem.description}
        </p>

        <Form {...form}>
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Label>Expiry Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        size="sm"
                        className={cn(
                          "flex-1 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Label>Category</Label>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category, index) => (
                        <SelectItem key={index} value={category.name}>
                          <span>
                            {category.emoji} {category.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <div className="flex space-x-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="h-9 w-14 text-center"
                      {...field}
                    />
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <div>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit, index) => (
                          <SelectItem key={index} value={unit}>
                            <span>{unit}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>
          </div>
        </Form>
      </div>
    </>
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
