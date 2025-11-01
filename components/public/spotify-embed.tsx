"use client";

type SpotifyEmbedProps = {
  embedUrl: string; // expected https://open.spotify.com/embed/<type>/<id>?...
  title?: string;
  height?: number;
};

/**
 * Minimal Spotify embed via iframe. Caller provides an embed URL constructed
 * server-side to avoid parsing on the client. Lazy loads, dark theme by URL.
 */
export function SpotifyEmbed({ embedUrl, title = "Spotify", height = 152 }: SpotifyEmbedProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border">
      <iframe
        title={title}
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

