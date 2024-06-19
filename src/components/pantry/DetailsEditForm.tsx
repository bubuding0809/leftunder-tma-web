import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#components/ui/form";
import { Input } from "#components/ui/input";
import {
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import {
  categories,
  detailsEditFormSchema,
  units,
} from "#/schema/food-item-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { on as onTmaEvent, off as offTmaEvent } from "@tma.js/sdk";
import {
  MiniAppsEventListener,
  postEvent,
  useMainButton,
  usePopup,
} from "@tma.js/sdk-react";
import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "#/server/api/root";
import { Label } from "#components/ui/label";
import { Textarea } from "#components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn, stripLeadingZeros } from "#/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import { api } from "#/utils/api";
import toast from "react-hot-toast";

interface DetailsEditFormProps {
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  isEditMode: boolean;
  setIsEditMode: Dispatch<SetStateAction<boolean>>;
  foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0];
}

const DetailsEditForm = ({
  setDrawerOpen,
  isEditMode,
  setIsEditMode,
  foodItem,
}: DetailsEditFormProps) => {
  const tmaPopup = usePopup(true);

  const form = useForm<z.infer<typeof detailsEditFormSchema>>({
    resolver: zodResolver(detailsEditFormSchema),
    defaultValues: {
      id: foodItem.id,
      name: foodItem.name,
      description: foodItem.description,
      category: foodItem.category,
      quantity: foodItem.quantity.toString(),
      unit: foodItem.unit,
      expiryDate: foodItem.expiry_date ?? new Date(),
      consumed: foodItem.consumed,
      storageInstructions: foodItem.storage_instructions,
    },
  });

  const onOpenChange = (open: boolean) => {
    // Ask user to confirm if they want to discard changes when closing the form
    if (!open && form.formState.isDirty) {
      postEvent("web_app_trigger_haptic_feedback", {
        type: "notification",
        notification_type: "warning",
      });

      tmaPopup?.open({
        title: "Stop Editing?",
        message: "Are you sure you want to discard the changes?",
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
    } else {
      setIsEditMode(open);
    }
  };

  return (
    <Dialog open={isEditMode} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-screen overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DetailsEditFormContent
          form={form}
          foodItem={foodItem}
          setIsEditMode={setIsEditMode}
          setDrawerOpen={setDrawerOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

interface DetailsEditFormContentProps {
  form: UseFormReturn<z.infer<typeof detailsEditFormSchema>>;
  foodItem: inferRouterOutputs<AppRouter>["foodItem"]["getFilteredFoodItems"][0];
  setIsEditMode: Dispatch<SetStateAction<boolean>>;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
}
const DetailsEditFormContent = ({
  form,
  setIsEditMode,
  setDrawerOpen,
  foodItem,
}: DetailsEditFormContentProps) => {
  const tmaMainButton = useMainButton(true);
  const queryClient = api.useUtils();

  const updateFullFoodItemDetailsMutation =
    api.foodItem.updateFullFoodItemDetails.useMutation({
      onSuccess: () => {
        queryClient.foodItem.getFilteredFoodItems.invalidate();
      },
      onSettled: () => {
        tmaMainButton?.hideLoader();
        setIsEditMode(false);
        setDrawerOpen(true);
      },
    });

  // Set up tma main button to enable saving of changes to food item
  useEffect(() => {
    const onSaveChanges = () => {
      postEvent("web_app_trigger_haptic_feedback", {
        type: "notification",
        notification_type: "success",
      });

      form.handleSubmit(onSubmit, onError)();
    };
    tmaMainButton?.setParams({
      bgColor: "#1C5638",
      text: "💾 Save item details",
    });
    tmaMainButton?.enable();
    tmaMainButton?.on("click", onSaveChanges);
    tmaMainButton?.show();

    return () => {
      tmaMainButton?.off("click", onSaveChanges);
      tmaMainButton?.hide();
    };
  }, [tmaMainButton]);

  // Setup popup event listener to close drawer when user confirms
  useEffect(() => {
    const onPopupClosed: MiniAppsEventListener<"popup_closed"> = ({
      button_id,
    }) => {
      if (button_id === "ok") {
        setIsEditMode(false);
        setDrawerOpen(true);
        form.reset();
      }
    };
    onTmaEvent("popup_closed", onPopupClosed);

    return () => {
      offTmaEvent("popup_closed", onPopupClosed);
    };
  }, []);

  const onSubmit: SubmitHandler<z.infer<typeof detailsEditFormSchema>> = (
    data,
  ) => {
    tmaMainButton?.showLoader();
    toast.promise(
      updateFullFoodItemDetailsMutation.mutateAsync(data),
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
  };

  const onError: SubmitErrorHandler<z.infer<typeof detailsEditFormSchema>> = (
    data,
  ) => {
    console.error(data);
  };

  const unitOptions = useMemo(() => {
    if (units.includes(foodItem.unit)) {
      return units;
    }
    return [...units, foodItem.unit];
  }, [units, foodItem.unit]);

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
  }, [categories, foodItem.category]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit food item</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-2 overflow-y-auto p-1"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Food name</FormLabel>
                <FormControl>
                  <Input
                    className="text-base"
                    placeholder="Name of the food item"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select a category"
                        className="text-base"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category, index) => (
                        <SelectItem key={index} value={category.name}>
                          <span className="text-base">
                            {category.emoji} {category.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description of the food item"
                    className="text-base"
                    {...field}
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry date</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "flex w-full flex-1 font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <span className="text-base">
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="storageInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="How to store this for maximum freshness"
                    className="text-base"
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="mt-4 flex flex-col space-y-3 pt-1">
            <Label>Quantity/unit</Label>
            <div className="flex space-x-1.5">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem className="w-2/5">
                    <FormControl>
                      <Input
                        className="text-base"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (isNaN(value)) return onChange("0");
                          onChange(stripLeadingZeros(value));
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="w-3/5">
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((unit, index) => (
                            <SelectItem key={index} value={unit}>
                              <span className="text-base">{unit}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};

export default DetailsEditForm;
