import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = new URL(env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  return [
    { url: new URL("/", base).toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/login", base).toString(), changeFrequency: "yearly", priority: 0.2 },
    { url: new URL("/register", base).toString(), changeFrequency: "yearly", priority: 0.3 },
  ];
}

