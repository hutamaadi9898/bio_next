export type SocialPlatform =
  | "twitter"
  | "instagram"
  | "tiktok"
  | "github"
  | "linkedin"
  | "youtube"
  | "facebook"
  | "threads"
  | "bluesky";

export type NormalizedLink = {
  url: string;
  type: "social" | "link";
  title: string;
  platform?: SocialPlatform;
};

const platformDomains: Record<SocialPlatform, string[]> = {
  twitter: ["twitter.com", "x.com"],
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  github: ["github.com"],
  linkedin: ["linkedin.com"],
  youtube: ["youtube.com", "youtu.be"],
  facebook: ["facebook.com"],
  threads: ["threads.net"],
  bluesky: ["bsky.app"],
};

const platformTitles: Record<SocialPlatform, string> = {
  twitter: "Twitter",
  instagram: "Instagram",
  tiktok: "TikTok",
  github: "GitHub",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  facebook: "Facebook",
  threads: "Threads",
  bluesky: "Bluesky",
};

function detectPlatformFromHost(host: string): SocialPlatform | null {
  const h = host.toLowerCase();
  for (const [platform, domains] of Object.entries(platformDomains) as [SocialPlatform, string[]][]) {
    if (domains.some((d) => h === d || h.endsWith(`.${d}`))) return platform;
  }
  return null;
}

function sanitizeUrl(input: string): string | null {
  try {
    if (/^https?:\/\//i.test(input)) {
      const u = new URL(input);
      u.hash = "";
      return u.toString();
    }
    // Handle bare domains like twitter.com/user
    if (/^[a-z]+:\/\//i.test(input) === false && /\w+\.[a-z]{2,}/i.test(input)) {
      const u = new URL(`https://${input}`);
      u.hash = "";
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function makeTitleFromUrl(u: URL): string {
  const host = u.hostname.replace(/^www\./, "");
  const platform = detectPlatformFromHost(host);
  if (platform) return platformTitles[platform];
  return host;
}

export function normalizeSocialOrLink(inputRaw: string): NormalizedLink | null {
  const input = (inputRaw || "").trim();
  if (!input) return null;

  // Handle patterns like "twitter @user" or "ig @user"
  const handleMatch = /\b(twitter|x|ig|instagram|github|gh|linkedin|li|youtube|yt|tiktok|fb|facebook|threads|bluesky)\b[^@]*@([A-Za-z0-9_.]+)/i.exec(
    input,
  );
  if (handleMatch) {
    const key = handleMatch[1]!.toLowerCase();
    const handle = handleMatch[2]!;
    const platform: SocialPlatform =
      key === "x" || key === "twitter"
        ? "twitter"
        : key === "ig" || key === "instagram"
          ? "instagram"
          : key === "gh" || key === "github"
            ? "github"
            : key === "li" || key === "linkedin"
              ? "linkedin"
              : key === "yt" || key === "youtube"
                ? "youtube"
                : key === "tiktok"
                  ? "tiktok"
                  : key === "fb" || key === "facebook"
                    ? "facebook"
                    : key === "threads"
                      ? "threads"
                      : "bluesky";
    const url = buildUrlFromHandle(platform, handle);
    return { url, type: "social", title: platformTitles[platform], platform };
  }

  // Handle standalone @handle – ambiguous; skip to avoid guessing wrong
  if (/^@/.test(input)) {
    return null;
  }

  const sanitized = sanitizeUrl(input);
  if (!sanitized) return null;
  const url = new URL(sanitized);
  const platform = detectPlatformFromHost(url.hostname.replace(/^www\./, ""));
  const title = makeTitleFromUrl(url);
  return {
    url: url.toString(),
    type: platform ? "social" : "link",
    title,
    platform: platform ?? undefined,
  };
}

export function buildUrlFromHandle(platform: SocialPlatform, handle: string): string {
  const h = handle.replace(/^@/, "");
  switch (platform) {
    case "twitter":
      return `https://x.com/${h}`;
    case "instagram":
      return `https://instagram.com/${h}`;
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    case "github":
      return `https://github.com/${h}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${h}`;
    case "youtube":
      return `https://www.youtube.com/@${h}`;
    case "facebook":
      return `https://www.facebook.com/${h}`;
    case "threads":
      return `https://www.threads.net/@${h}`;
    case "bluesky":
      return `https://bsky.app/profile/${h}.bsky.social`;
  }
}

