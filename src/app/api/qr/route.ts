import QRCode from "qrcode";

// GET /api/qr?data=CLS-XXXXXX → PNG image
export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = url.searchParams.get("data");
  if (!data || data.length > 200) {
    return new Response("invalid data", { status: 400 });
  }
  const png = await QRCode.toBuffer(data, {
    width: 320,
    margin: 2,
    color: { dark: "#134E4A", light: "#FFFFFF" },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
