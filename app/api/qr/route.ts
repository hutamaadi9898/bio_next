import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data")?.toString() ?? "";
  const sizeParam = Number(searchParams.get("size") ?? 200);
  const marginParam = Number(searchParams.get("margin") ?? 2);
  const format = (searchParams.get("format") || "png").toString().toLowerCase();

  if (!data) {
    return new NextResponse("Missing data", { status: 400 });
  }
  if (data.length > 2048) {
    return new NextResponse("Data too long", { status: 400 });
  }
  const size = Number.isFinite(sizeParam) ? Math.min(Math.max(64, sizeParam), 1024) : 200;
  const margin = Number.isFinite(marginParam) ? Math.min(Math.max(0, marginParam), 16) : 2;

  // Try to require the optional 'qrcode' dependency at runtime to generate
  // a PNG locally without external calls.
  let QR: any = null;
  try {
    // eslint-disable-next-line no-eval
    const req = (eval("require") as NodeRequire);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    QR = req("qrcode");
  } catch {
    QR = null;
  }
  if (!QR) {
    return new NextResponse("QR library not installed", { status: 501 });
  }

  try {
    if (format === "svg") {
      const svg: string = await new Promise((resolve, reject) => {
        QR.toString(data, { type: "svg", margin, width: size }, (err: Error | null, out: string) =>
          err ? reject(err) : resolve(out),
        );
      });
      return new Response(svg, {
        status: 200,
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=600",
        },
      });
    } else {
      const buffer: Buffer = await new Promise((resolve, reject) => {
        QR.toBuffer(
          data,
          { type: "png", width: size, margin },
          (err: Error | null, buf: Buffer) => (err ? reject(err) : resolve(buf)),
        );
      });
      const bytes = new Uint8Array(buffer);
      return new Response(bytes, {
        status: 200,
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=600",
        },
      });
    }
  } catch {
    return new NextResponse("QR generation failed", { status: 500 });
  }
}
