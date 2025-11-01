"use client";

import * as React from "react";

type YouTubeLiteProps = {
  videoId: string;
  title?: string;
};

/**
 * Lightweight YouTube embed without loading the iframe until interaction.
 * Mobile-first, dark friendly, no third-party dependencies.
 */
export function YouTubeLite({ videoId, title = "YouTube video" }: YouTubeLiteProps) {
  const [playing, setPlaying] = React.useState(false);

  if (playing) {
    const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    return (
      <div className="relative w-full overflow-hidden rounded-xl border" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute left-0 top-0 h-full w-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative w-full overflow-hidden rounded-xl border"
      style={{ paddingTop: "56.25%" }}
      aria-label={`Play ${title}`}
    >
      <img
        src={thumb}
        alt="Video thumbnail"
        className="absolute left-0 top-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 ring-1 ring-white/30 transition group-hover:scale-105">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-10 w-10 text-white drop-shadow"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  );
}

