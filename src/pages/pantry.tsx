import MainLayout from "#/components/layouts/MainLayout";
import { TmaSDKLoader } from "#/components/layouts/TmaSdkLoader";
import { Button, buttonVariants } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { NextPageWithLayout } from "#/pages/_app";
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
  AlignLeft,
  ArrowUpDown,
  CalendarDays,
  CalendarIcon,
  ChevronRight,
  Cross,
  EggFried,
  HeartHandshake,
  Home,
  Leaf,
  X,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import {
  Dispatch,
  SetStateAction,
  use,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "#/components/ui/drawer";
import { cn, stripLeadingZeros } from "#/lib/utils";
import { api } from "#/utils/api";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "#/server/api/root";
import { match } from "ts-pattern";
import { differenceInDays, format, isAfter, isBefore, set } from "date-fns";
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
import { FormField } from "#/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  categories,
  foodItemFormSchema,
  units,
} from "#/schema/food-item-schema";
import DetailsDrawer from "#/components/pantry/DetailsDrawer";
import DetailsEditForm from "#/components/pantry/DetailsEditForm";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "#/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PantryPage: NextPageWithLayout = () => {
  const initData = useInitData(true);
  const tmaClosingBehavior = useClosingBehavior(true);
  const tmaMainButton = useMainButton(true);
  const tmaPopup = usePopup(true);

  const {
    debouncedValue: search,
    liveValue: liveSearch,
    setLiveValue: setLiveSearch,
  } = useDebounce({
    initialValue: "",
    delay: 250,
  });
  const pathName = usePathname();

  const [categoryFilter, setCategoryFilter] = useState<
    inferRouterInputs<AppRouter>["foodItem"]["getFilteredFoodItems"]["filters"]["category"]
  >([]);
  const [statusFilter, setStatusFilter] =
    useState<
      inferRouterInputs<AppRouter>["foodItem"]["getFilteredFoodItems"]["filters"]["status"]
    >("active");
  const [sort, setSort] = useState<
    inferRouterInputs<AppRouter>["foodItem"]["getFilteredFoodItems"]["sort"]
  >({
    field: "created_at",
    direction: "desc",
  });

  // TRPC queryContext to access query cache
  const queryClient = api.useUtils();

  // TRPC query to get filtered food items
  const foodItemsQuery = api.foodItem.getFilteredFoodItems.useQuery(
    {
      telegramUserId: initData?.user?.id,
      search: search,
      filters: {
        category: categoryFilter,
        status: statusFilter,
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

  // TRPC mutation to update many food items' details for quick edit mode
  const updateManyFoodItemDetailsMutation =
    api.foodItem.updateManyFoodItemDetails.useMutation({
      onSuccess: () => {
        queryClient.foodItem.getFilteredFoodItems.invalidate();
      },
    });

  const [editable, setEditable] = useState(false);
  const [editedFoodItemForms, setEditedFoodItemForms] = useState<
    Record<string, z.infer<typeof foodItemFormSchema>>
  >({});

  useEffect(() => {
    tmaClosingBehavior?.enableConfirmation();
    return () => {
      tmaClosingBehavior?.disableConfirmation();
    };
  }, [tmaClosingBehavior]);

  useEffect(() => {
    // Enable save changes button on main button click
    const onMainButtonClicked = () => {
      toast.promise(
        updateManyFoodItemDetailsMutation.mutateAsync({
          foodItems: Object.values(editedFoodItemForms),
        }),
        {
          loading: "Saving changes...",
          success: "Changes saved successfully",
          error: "Failed to save changes",
        },
        {
          className: "text-xs font-medium",
          position: "top-right",
          style: {
            paddingBlock: "1rem",
          },
          success: {
            icon: "🎉",
          },
        },
      );
      tmaMainButton?.off("click", onMainButtonClicked);
      setEditedFoodItemForms({});
      setEditable(false);
    };

    if (editable) {
      tmaMainButton?.on("click", onMainButtonClicked);
    } else {
      tmaMainButton?.off("click", onMainButtonClicked);
    }

    return () => {
      tmaMainButton?.off("click", onMainButtonClicked);
    };
  }, [editable, editedFoodItemForms]);

  useEffect(() => {
    if (editable) {
      tmaMainButton?.setParams({
        bgColor: "#1C5638",
        text: "💾 Save quick edit changes",
      });
      tmaMainButton?.enable();
      tmaMainButton?.show();
    } else {
      tmaMainButton?.hide();
    }

    return () => {
      tmaMainButton?.hide();
    };
  }, [editable]);

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
      setEditable(true);
    } else {
      // Ask if user wants to discard changes when quick edit is disabled
      const onPopupClosed: MiniAppsEventListener<"popup_closed"> = ({
        button_id,
      }) => {
        if (button_id === "cancel") return;
        if (button_id === "ok") {
          setEditable(false);
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
      <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
        {/* Top header */}
        <div
          className="rounded-b-3xl bg-cover bg-left-bottom bg-no-repeat px-4 pb-5 pt-8"
          style={{
            backgroundImage: `url(/assets/header_background.png)`,
          }}
        >
          <div className="flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ring-offset-2 hover:bg-transparent hover:ring-1"
                >
                  <AlignLeft className="h-6 w-6 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="pt-10">
                  <ul className="flex flex-col space-y-10">
                    <Link
                      href="/pantry"
                      className={cn("flex items-center space-x-2")}
                    >
                      <Home className="h-5 w-5" />
                      <p
                        className={cn(
                          pathName === "/pantry" && "font-semibold",
                        )}
                      >
                        My pantry
                      </p>
                    </Link>
                    <Link
                      href="/stats"
                      className={cn("flex items-center space-x-2")}
                    >
                      <Leaf className="h-5 w-5" />
                      <p
                        className={cn(pathName === "/stats" && "font-semibold")}
                      >
                        My Stats
                      </p>
                    </Link>
                    <Link
                      href="/recipe"
                      className={cn("flex items-center space-x-2")}
                    >
                      <EggFried className="h-5 w-5" />
                      <p
                        className={cn(
                          pathName === "/recipe" && "font-semibold",
                        )}
                      >
                        Recipe Generator
                      </p>
                    </Link>
                    <Link
                      href="/donate"
                      className={cn("flex items-center space-x-2")}
                    >
                      <HeartHandshake className="h-5 w-5" />
                      <p
                        className={cn(
                          pathName === "/donate" && "font-semibold",
                        )}
                      >
                        Donate
                      </p>
                    </Link>
                    <li className="flex items-center space-x-2"></li>
                    <li className="flex items-center space-x-2"></li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
            <hgroup className="flex w-full items-center justify-between text-white">
              <h1 className="text-2xl">
                <span className="font-medium">Pantry</span>
              </h1>
              <Link href="/stats" className="flex items-center">
                <span>My stats 🟢</span>
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </hgroup>
          </div>
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
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={`${sort.field}:${sort.direction}`}
                  onValueChange={onSortChange}
                >
                  <DropdownMenuRadioItem value="created_at:desc">
                    ✍️ Newest first
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="created_at:asc">
                    ✍️ Oldest first
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="expiry_date:desc">
                    ⏳ Expiring last
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="expiry_date:asc">
                    ⌛️ Expiring soon
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white pt-2">
          <ul className="flex space-x-1 overflow-x-auto px-4 pb-2 pt-1">
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
                  {categoryFilter.includes(category.name) && (
                    <X className="h-4 w-4" />
                  )}
                  <span className="ml-1">{`${category.emoji} ${category.name}`}</span>
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between px-4 pb-2 pt-2 text-sm">
            <div className="flex items-center space-x-2">
              <Switch
                id="airplane-mode"
                checked={editable}
                onCheckedChange={onQuickEditToggle}
              />
              <Label htmlFor="airplane-mode">Quick edit</Label>
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value as inferRouterInputs<AppRouter>["foodItem"]["getFilteredFoodItems"]["filters"]["status"],
                )
              }
            >
              <TabsList className="ml-auto grid w-48 grid-cols-2">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Food item list */}
      {match(foodItemsQuery)
        .with(
          {
            status: "success",
          },
          ({ data }) => (
            <FoodItemsList
              foodItems={data}
              editable={editable}
              setEditedFoodItemForms={setEditedFoodItemForms}
              statusFilter={statusFilter}
            />
          ),
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
  onAction: (t: Toast) => void,
  icon: string = "🎉",
  duration: number = 3000,
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
      duration,
      icon,
      position: "top-right",
    },
  );
};

interface FoodItemsListProps {
  foodItems: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"];
  editable: boolean;
  setEditedFoodItemForms: Dispatch<
    SetStateAction<Record<string, z.infer<typeof foodItemFormSchema>>>
  >;
  statusFilter: inferRouterInputs<AppRouter>["foodItem"]["getFilteredFoodItems"]["filters"]["status"];
}
const FoodItemsList = ({
  foodItems,
  editable,
  setEditedFoodItemForms,
  statusFilter,
}: FoodItemsListProps) => {
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

  const today = set(new Date(), {
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  const trailingSwipeActions = (
    foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0],
  ) => {
    const isExpired = isBefore(
      set(new Date(foodItem.expiry_date!), {
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      today,
    );

    return (
      <TrailingActions>
        {/* Delete item action */}
        {
          <SwipeAction
            destructive={true}
            onClick={() => {
              postEvent("web_app_trigger_haptic_feedback", {
                type: "notification",
                notification_type: "success",
              });
              updateDeleteStatusMutation.mutate(
                { foodItemId: foodItem.id, deleted: true },
                {
                  onSuccess: () => {
                    // Show toast notification to allow user to undo the action
                    onSendToast(
                      "Food item deleted successfully",
                      "Undo",
                      (t) => {
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
        }

        {/* Consume item action */}
        {!foodItem.consumed && (
          <SwipeAction
            destructive={!isBefore(new Date(foodItem.expiry_date!), today)}
            onClick={() => {
              postEvent("web_app_trigger_haptic_feedback", {
                type: "notification",
                notification_type: "success",
              });
              updateConsumeStatusMutation.mutate(
                { foodItemId: foodItem.id, consumed: true },
                {
                  onSuccess: () => {
                    // Show toast notification to allow user to undo the action
                    onSendToast("Food item marked as consumed", "Undo", (t) => {
                      postEvent("web_app_trigger_haptic_feedback", {
                        type: "notification",
                        notification_type: "success",
                      });
                      updateConsumeStatusMutation
                        .mutateAsync({
                          foodItemId: foodItem.id,
                          consumed: false,
                        })
                        .then(() => toast.dismiss(t.id));
                    });
                  },
                },
              );
            }}
          >
            <div className="flex items-center rounded-r-md bg-primary px-5">
              <span className="text-md w-max text-white">✅</span>
            </div>
          </SwipeAction>
        )}

        {/* Unconsume item action */}
        {foodItem.consumed && (
          <SwipeAction
            destructive={!isBefore(new Date(foodItem.expiry_date!), today)}
            onClick={() => {
              postEvent("web_app_trigger_haptic_feedback", {
                type: "notification",
                notification_type: "success",
              });
              updateConsumeStatusMutation.mutate(
                { foodItemId: foodItem.id, consumed: false },
                {
                  onSuccess: () => {
                    // Show toast notification to allow user to undo the action
                    onSendToast(
                      "Food item marked as unconsumed",
                      "Undo",
                      (t) => {
                        postEvent("web_app_trigger_haptic_feedback", {
                          type: "notification",
                          notification_type: "success",
                        });
                        updateConsumeStatusMutation
                          .mutateAsync({
                            foodItemId: foodItem.id,
                            consumed: true,
                          })
                          .then(() => toast.dismiss(t.id));
                      },
                    );
                  },
                },
              );
            }}
          >
            <div className="flex items-center rounded-r-md bg-accent px-5">
              <span className="text-md w-max text-white">↩️</span>
            </div>
          </SwipeAction>
        )}
      </TrailingActions>
    );
  };

  if (foodItems.length > 0) {
    return (
      <SwipeableList
        className="space-y-4 p-4"
        type={Type.IOS}
        destructiveCallbackDelay={250}
      >
        {foodItems.map((foodItem) => (
          <SwipeableListItem
            key={foodItem.id}
            trailingActions={trailingSwipeActions(foodItem)}
            className={cn(
              "w-full rounded-md border bg-white p-2 shadow",
              !foodItem.consumed &&
                isBefore(
                  set(new Date(foodItem.expiry_date!), {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    milliseconds: 0,
                  }),
                  today,
                ) &&
                "opacity-60",
            )}
          >
            {editable ? (
              <FoodItemEditCard
                foodItem={foodItem}
                setEditedFoodItemForms={setEditedFoodItemForms}
              />
            ) : (
              <FoodItemCard foodItem={foodItem} statusFilter={statusFilter} />
            )}
          </SwipeableListItem>
        ))}
      </SwipeableList>
    );
  }

  return <FoodItemsEmpty />;
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
  statusFilter: inferRouterInputs<AppRouter>["foodItem"]["getFilteredFoodItems"]["filters"]["status"];
  foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0];
}
const FoodItemCard = ({ foodItem, statusFilter }: FoodItemCardProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
    if (foodItem.consumed) return "bg-green-600";

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
  }, [timeToExpiry, foodItem.consumed]);

  return (
    <>
      <div className="relative flex self-start">
        <div className="relative aspect-square h-28 w-28">
          <Image
            src={foodItem?.image_url ?? ""}
            className="rounded object-cover"
            alt={foodItem.name}
            fill
          />
        </div>
      </div>

      <div className="ml-3 flex flex-1 flex-col space-y-1.5 self-start">
        <h2 className="line-clamp-1 font-semibold">{foodItem.name}</h2>
        <p className="line-clamp-2 text-xs font-light text-zinc-700">
          {foodItem.description}
        </p>
        <Badge
          variant="default"
          className={cn(
            "flex w-fit items-center rounded text-xs font-normal text-white",
            timeToExpiryColor,
          )}
        >
          {foodItem.consumed ? (
            <span>💚 consumed</span>
          ) : (
            <>
              <CalendarDays className="h-4 w-4" strokeWidth={2} />
              <span className="ml-2 text-nowrap">{timeToExpiry}</span>
            </>
          )}
        </Badge>
        <p className="text-xs text-zinc-500">
          <span>
            {categories.find((category) => category.name === foodItem.category)
              ?.emoji ?? "🍴"}{" "}
            {foodItem.category}
          </span>{" "}
          |{" "}
          <span>
            {foodItem.quantity.toString()} {foodItem.unit}
          </span>
        </p>
      </div>

      <DetailsDrawer
        open={isDrawerOpen}
        setOpen={setIsDrawerOpen}
        setIsEditMode={setIsEditMode}
        foodItem={foodItem}
        timeToExpiry={timeToExpiry}
        timeToExpiryColor={timeToExpiryColor}
        statusFilter={statusFilter}
      />

      <DetailsEditForm
        setDrawerOpen={setIsDrawerOpen}
        foodItem={foodItem}
        setIsEditMode={setIsEditMode}
        isEditMode={isEditMode}
      />
    </>
  );
};

interface FoodItemEditCardProps {
  foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0];
  setEditedFoodItemForms: Dispatch<
    SetStateAction<Record<string, z.infer<typeof foodItemFormSchema>>>
  >;
}
const FoodItemEditCard = ({
  foodItem,
  setEditedFoodItemForms,
}: FoodItemEditCardProps) => {
  const form = useForm<z.infer<typeof foodItemFormSchema>>({
    resolver: zodResolver(foodItemFormSchema),
    defaultValues: {
      id: foodItem.id,
      expiryDate: new Date(foodItem.expiry_date ?? ""),
      category: foodItem.category,
      quantity: foodItem.quantity.toString(),
      unit: foodItem.unit,
      consumed: false,
    },
  });

  const checkedForConsumed = form.watch("consumed");

  const unitOptions = useMemo(() => {
    if (units.includes(foodItem.unit)) {
      return units;
    }
    return [...units, foodItem.unit];
  }, [foodItem.unit, units]);

  const categoryOptions = useMemo(() => {
    if (categories.find((category) => category.name === foodItem.category)) {
      return categories;
    }
    return [
      ...categories,
      {
        name: foodItem.category,
        emoji: "🍴",
      },
    ];
  }, [foodItem.category, categories]);

  // Update edited food item forms when form values change
  useEffect(() => {
    const subscription = form.watch((values) => {
      const parsedValues = foodItemFormSchema.parse(values);
      setEditedFoodItemForms((prev) => ({
        ...prev,
        [foodItem.id]: parsedValues,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <div className="relative flex h-min self-start">
        <Avatar className="relative">
          <AvatarImage src={foodItem?.image_url ?? ""} />
          <AvatarFallback>
            {categories.find((category) => category.name === foodItem.category)
              ?.emoji ?? "🍴"}
          </AvatarFallback>
        </Avatar>
      </div>

      <Form {...form} className="ml-3 flex flex-1 flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <h2 className="line-clamp-1 font-semibold">{foodItem.name}</h2>

          {/* Checkbox field for consumption */}
          {!foodItem.consumed && (
            <FormField
              control={form.control}
              name="consumed"
              render={({ field }) => (
                <div className="ml-1 flex items-center space-x-1">
                  <Label
                    htmlFor={`consumed-${foodItem.id}`}
                    className={cn(
                      "text-xs font-medium leading-none text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                      checkedForConsumed
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    Consumed
                  </Label>
                  <Checkbox
                    id={`consumed-${foodItem.id}`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          )}
        </div>
        <p className="line-clamp-2 text-xs font-light text-zinc-700">
          {foodItem.description}
        </p>
        <div className="space-y-2">
          {/* Calendar input for expiry date */}
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <div className="grid grid-cols-4 items-center">
                <Label className="grid-cols-1">Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      // size="sm"
                      className={cn(
                        "col-span-3 ml-2 flex h-8 flex-1 font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <span>
                        {field.value
                          ? format(field.value, "PP")
                          : "Pick a date"}
                      </span>
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      defaultMonth={field.value}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          />

          {/* Select dropdown for category field */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <div className="grid grid-cols-4 items-center">
                <Label className="col-span-1">Category</Label>
                <div className="col-span-3 ml-2">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category, index) => (
                        <SelectItem key={index} value={category.name}>
                          <span>
                            {category.emoji} {category.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          />

          <div className="grid grid-cols-4 items-center">
            <Label className="col-span-1">Quantity</Label>

            <div className="col-span-3 ml-2 flex space-x-1.5">
              {/* Numeric input for quantity */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    className="h-8 w-16 text-center"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value)) return onChange("0");
                      const cleaned = stripLeadingZeros(value);
                      onChange(cleaned);
                    }}
                    {...field}
                  />
                )}
              />

              {/* Select field for unit */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit, index) => (
                        <SelectItem key={index} value={unit}>
                          <span>{unit}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>
      </Form>
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
