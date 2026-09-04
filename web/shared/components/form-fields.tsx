"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { cn } from "@/shared/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, type LucideIcon } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";

function resolveFormFieldIcon(name?: string, label?: string, type?: string): string | undefined {
  const n = (name || "").toLowerCase();
  const l = (label || "").toLowerCase();
  const t = (type || "").toLowerCase();
  const combined = `${n} ${l} ${t}`;

  if (t === "email" || combined.includes("email") || combined.includes("mail")) return "mail";
  if (t === "password" || combined.includes("password")) return "lock";
  if (t === "tel" || combined.includes("phone") || combined.includes("mobile")) return "phone";
  if (combined.includes("company") || combined.includes("organization") || combined.includes("client")) return "companies";
  if (combined.includes("name") || combined.includes("customer") || combined.includes("user") || combined.includes("assignee") || combined.includes("owner") || combined.includes("contact")) return "user";
  if (combined.includes("value") || combined.includes("price") || combined.includes("revenue") || combined.includes("amount") || combined.includes("budget") || combined.includes("cost") || combined.includes("rate")) return "plans";
  if (combined.includes("probability") || combined.includes("percent")) return "filter";
  if (t === "date" || t === "datetime-local" || combined.includes("date") || combined.includes("followup") || combined.includes("follow-up") || combined.includes("time") || combined.includes("duration")) return "calendar";
  if (combined.includes("status") || combined.includes("stage")) return "tag";
  if (combined.includes("priority")) return "alert";
  if (combined.includes("role")) return "security";
  if (combined.includes("task") || combined.includes("title") || combined.includes("subject")) return "tasks";
  if (combined.includes("deal")) return "deals";
  if (combined.includes("website") || combined.includes("url") || combined.includes("link")) return "externalLink";
  if (combined.includes("industry") || combined.includes("department")) return "teamPerformance";
  if (combined.includes("note") || combined.includes("summary") || combined.includes("outcome") || combined.includes("description")) return "quotations";
  
  return undefined;
}

interface BaseFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  className?: string;
  type?: string;
  icon?: LucideIcon | React.ComponentType<any>;
  iconName?: string;
  hideIcon?: boolean;
}

export const FormInput = ({
  name,
  label,
  placeholder,
  description,
  className,
  type,
  icon,
  iconName,
  hideIcon = false,
}: BaseFieldProps) => {
  const { control } = useFormContext();
  const resolvedIconName = !hideIcon ? (iconName || resolveFormFieldIcon(name, label, type)) : undefined;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("group", className)}>
          <FormLabel>{label}</FormLabel>
          <div className="relative flex items-center w-full">
            {(icon || resolvedIconName) && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground/70 pointer-events-none z-10 transition-colors group-focus-within:text-primary">
                <AppIcon
                  name={resolvedIconName}
                  icon={icon}
                  size={16}
                  disableHover={true}
                  className="text-muted-foreground/70 group-focus-within:text-primary transition-colors"
                />
              </div>
            )}
            <FormControl>
              <Input
                type={type}
                placeholder={placeholder}
                className={cn((icon || resolvedIconName) ? "pl-9" : "")}
                {...field}
              />
            </FormControl>
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const FormTextarea = ({
  name,
  label,
  placeholder,
  description,
  className,
  icon,
  iconName,
  hideIcon = false,
}: BaseFieldProps) => {
  const { control } = useFormContext();
  const resolvedIconName = !hideIcon ? (iconName || resolveFormFieldIcon(name, label)) : undefined;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("group", className)}>
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            {(icon || resolvedIconName) && (
              <AppIcon
                name={resolvedIconName}
                icon={icon}
                size={14}
                disableHover={true}
                className="text-muted-foreground/60 group-focus-within:text-primary transition-colors"
              />
            )}
          </div>
          <FormControl>
            <Textarea placeholder={placeholder} className="min-h-32" {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

interface FormSelectProps extends BaseFieldProps {
  options: { label: string; value: string }[];
}

export const FormSelect = ({
  name,
  label,
  placeholder,
  description,
  options,
  className,
  icon,
  iconName,
  hideIcon = false,
}: FormSelectProps) => {
  const { control } = useFormContext();
  const resolvedIconName = !hideIcon ? (iconName || resolveFormFieldIcon(name, label)) : undefined;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("group", className)}>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
            <div className="relative flex items-center w-full">
              {(icon || resolvedIconName) && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground/70 pointer-events-none z-10 transition-colors group-focus-within:text-primary">
                  <AppIcon
                    name={resolvedIconName}
                    icon={icon}
                    size={16}
                    disableHover={true}
                    className="text-muted-foreground/70 group-focus-within:text-primary transition-colors"
                  />
                </div>
              )}
              <FormControl>
                <SelectTrigger className={cn("w-full", (icon || resolvedIconName) ? "pl-9" : "", className)}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
            </div>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

interface FormDatePickerProps extends BaseFieldProps {
  disabled?: (date: Date) => boolean;
}

export const FormDatePicker = ({
  name,
  label,
  placeholder,
  description,
  className,
  disabled,
  icon,
  iconName,
}: FormDatePickerProps) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col group", className)}>
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-3 text-left font-normal justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">{field.value ? format(field.value, "PPP") : (placeholder || "Select date")}</span>
                  <AppIcon
                    name={iconName || "calendar"}
                    icon={icon || CalendarIcon}
                    size={16}
                    disableHover={true}
                    className="ml-auto h-4 w-4 opacity-70 group-focus-within:opacity-100 group-focus-within:text-primary transition-opacity"
                  />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={disabled ?? ((date) =>
                  date > new Date() || date < new Date("1900-01-01")
                )}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
