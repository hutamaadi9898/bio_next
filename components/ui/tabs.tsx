"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = TabsPrimitive.List;

const TabsTrigger = TabsPrimitive.Trigger;

const TabsContent = TabsPrimitive.Content;

export { Tabs, TabsList, TabsTrigger, TabsContent };

export const tabsListClass =
  "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground";

export const tabsTriggerClass = (active: boolean) =>
  cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    active ? "bg-background text-foreground shadow" : "hover:text-foreground",
  );
