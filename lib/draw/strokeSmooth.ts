import type { Point } from "@/lib/session/session.types";

/** Distance between two points */
export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Drop points closer than `minDist` to reduce noise */
export function thinPoints(points: Point[], minDist: number): Point[] {
  if (points.length < 2) return points;
  const out: Point[] = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    if (dist(out[out.length - 1]!, p) >= minDist) out.push(p);
  }
  if (out[out.length - 1] !== points[points.length - 1]) {
    out.push(points[points.length - 1]!);
  }
  return out;
}

/** Draw a smooth path through points using quadratic midpoints */
export function strokePath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  close = false,
): void {
  if (points.length < 2) return;
  const p = thinPoints(points, 1.2);
  if (p.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(p[0]!.x, p[0]!.y);
  for (let i = 1; i < p.length - 1; i++) {
    const xc = (p[i]!.x + p[i + 1]!.x) / 2;
    const yc = (p[i]!.y + p[i + 1]!.y) / 2;
    ctx.quadraticCurveTo(p[i]!.x, p[i]!.y, xc, yc);
  }
  const last = p[p.length - 1]!;
  ctx.quadraticCurveTo(last.x, last.y, last.x, last.y);
  if (close) ctx.closePath();
}
