import { ImageResponse } from "next/og";

import { db } from "@/lib/db";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: { handle: string } }) {
  const handle = params?.handle?.toLowerCase();
  const profile = await db.query.profiles.findFirst({
    where: (table, { eq }) => eq(table.handle, handle),
    with: { avatarAsset: true },
  });

  const title = profile?.displayName ?? handle ?? "Biogrid";
  const bio = profile?.bio ?? "Create a beautiful bento-style bio link";
  const avatar = profile?.avatarAsset?.url ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #111827 100%)",
          color: "#e5e7eb",
          padding: 64,
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {avatar ? (
            <img src={avatar} alt="avatar" width={96} height={96} style={{ borderRadius: 9999, border: "2px solid #374151" }} />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 8, fontSize: 24, color: "#9ca3af", maxWidth: 900 }}>{bio}</div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 36, right: 48, fontSize: 24, color: "#9ca3af" }}>biogrid.app</div>
      </div>
    ),
    { ...size }
  );
}
