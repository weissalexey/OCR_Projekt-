'use client';

import { useEffect } from "react";

export default function CanvasOverlay({
  canvasRef,
  width,
  height,
  fields,
  selection,
  snapLineY,
  drawGrid,
  drawSnapLine
}: any) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, width, height);
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    fields.forEach((f: any) => ctx.strokeRect(f.x, f.y, f.width, f.height));
    if (selection) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
    }
    drawSnapLine(ctx, snapLineY, width);
  }, [fields, selection, width, height, snapLineY]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border relative z-10"
    />
  );
}