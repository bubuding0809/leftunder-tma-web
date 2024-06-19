import { AppRouter } from "#/server/api/root";
import { api } from "#/utils/api";
import { postEvent } from "@tma.js/sdk-react";
import { inferRouterOutputs } from "@trpc/server";
import { Dispatch, SetStateAction } from "react";
import toast, { type Toast } from "react-hot-toast";
import { Separator } from "../ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "../ui/drawer";
import { Button } from "../ui/button";
import Spinner from "../ui/spinner";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "#/lib/utils";
import { josefinSans } from "#/pages/_app";
import { categories } from "#/schema/food-item-schema";
import { format } from "date-fns";

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

interface DetailsDrawerProps {
  setIsEditMode: Dispatch<SetStateAction<boolean>>;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0];
  timeToExpiry: string;
  timeToExpiryColor: string;
}

const DetailsDrawer = ({
  open,
  setOpen,
  setIsEditMode,
  foodItem,
  timeToExpiry,
  timeToExpiryColor,
}: DetailsDrawerProps) => {
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
          onSendToast("Food item marked as consumed", "Undo", (t) => {
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
          onSendToast("Food item deleted successfully", "Undo", (t) => {
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
          variant="ghost"
          className="ml-2 h-8 w-8 self-start rounded-full"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={3} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className={cn(josefinSans.className)}>
        <div className="flex flex-col px-4 py-3">
          <div className="relative">
            <img
              src={foodItem?.image_url ?? ""}
              alt={foodItem.name}
              className="aspect-video rounded object-contain shadow"
            />
            <Badge
              variant="default"
              className={cn(
                "absolute bottom-2 left-2 flex items-center rounded pl-2 text-xs font-normal text-white",
                timeToExpiryColor,
              )}
            >
              <CalendarDays className="h-4 w-4" strokeWidth={2} />
              <span className="ml-2 text-nowrap">{timeToExpiry}</span>
              <span className="ml-1">
                - expiring on{" "}
                {foodItem.expiry_date
                  ? format(foodItem.expiry_date, "PP")
                  : "N/A"}
              </span>
            </Badge>
          </div>
          <div className="flex flex-1 flex-col space-y-2 px-1 pt-4">
            <div className="flex items-center">
              <h2 className="font-semibold">{foodItem.name}</h2>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-6 w-min px-2 text-xs"
                onClick={() => {
                  setOpen(false);
                  setIsEditMode(true);
                }}
              >
                <span className="mr-1.5">✏️</span> Edit
              </Button>
            </div>
            <p className="line-clamp-2 text-xs font-light text-zinc-700">
              {foodItem.description}
            </p>
            <p className="text-xs text-zinc-500">
              <span>
                {categories.find(
                  (category) => category.name === foodItem.category,
                )?.emoji ?? "🍴"}{" "}
                {foodItem.category}
              </span>{" "}
              |{" "}
              <span>
                {foodItem.quantity.toString()} {foodItem.unit}
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

export default DetailsDrawer;
