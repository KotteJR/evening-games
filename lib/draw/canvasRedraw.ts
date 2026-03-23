import type { DrawStroke } from "@/lib/session/drawSession";
import { strokePath } from "@/lib/draw/strokeSmooth";

const WIDTHS = { s: 2, m: 5, l: 12 } as const;

export function redrawStrokes(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  strokes: DrawStroke[],
) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const dpr = ctx.canvas.width / cssW;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const s of strokes) {
    const lw = s.tool.eraser ? WIDTHS[s.tool.brush] * 3 : WIDTHS[s.tool.brush];
    ctx.strokeStyle = s.tool.eraser ? "#ffffff" : "#000000";
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = s.tool.eraser ? "destination-out" : "source-over";
    strokePath(ctx, s.points);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}
