import React, { useEffect, useRef, useState, useCallback } from "react";

export default function ImageCrop({ file, onCancel, onConfirm }) {
  const [img, setImg] = useState(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const vpRef = useRef(null);
  const dragging = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      setNatural({ w: im.naturalWidth, h: im.naturalHeight });
      setImg(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const vp = vpRef.current;
  const vpSize = vp ? vp.clientWidth : 256;
  const fitScale = natural.w
    ? Math.max(vpSize / natural.w, vpSize / natural.h)
    : 1;
  const dispW = natural.w * fitScale * zoom;
  const dispH = natural.h * fitScale * zoom;
  const maxX = Math.max(0, (dispW - vpSize) / 2);
  const maxY = Math.max(0, (dispH - vpSize) / 2);
  const cx = Math.max(-maxX, Math.min(maxX, offset.x));
  const cy = Math.max(-maxY, Math.min(maxY, offset.y));

  const onPointerDown = (e) => {
    dragging.current = { x: e.clientX, y: e.clientY, ox: cx, oy: cy };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setOffset({
      x: dragging.current.ox + (e.clientX - dragging.current.x),
      y: dragging.current.oy + (e.clientY - dragging.current.y),
    });
  };
  const onPointerUp = () => {
    dragging.current = null;
  };

  const confirm = useCallback(() => {
    if (!img || !natural.w) return;
    const OUT = 512;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    const left0 = (vpSize - dispW) / 2 + cx;
    const top0 = (vpSize - dispH) / 2 + cy;
    const scale = fitScale * zoom;
    let sx = -left0 / scale;
    let sy = -top0 / scale;
    let sSize = vpSize / scale;
    sx = Math.max(0, Math.min(sx, natural.w - sSize));
    sy = Math.max(0, Math.min(sy, natural.h - sSize));
    sSize = Math.min(sSize, natural.w - sx, natural.h - sy);
    if (sSize <= 0) return;
    const im = new Image();
    im.onload = () => {
      ctx.drawImage(im, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
      canvas.toBlob(
        (blob) => {
          if (blob) onConfirm?.(blob);
        },
        "image/jpeg",
        0.9
      );
    };
    im.src = img;
  }, [img, natural, vpSize, fitScale, zoom, cx, cy, onConfirm]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={vpRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-60 h-60 rounded-2xl overflow-hidden bg-muted touch-none cursor-grab active:cursor-grabbing"
      >
        {img && (
          <img
            src={img}
            alt=""
            draggable={false}
            className="absolute select-none"
            style={{
              width: dispW,
              height: dispH,
              left: `${(vpSize - dispW) / 2 + cx}px`,
              top: `${(vpSize - dispH) / 2 + cy}px`,
              maxWidth: "none",
            }}
          />
        )}
      </div>
      <div className="w-full max-w-xs flex items-center gap-3">
        <span className="text-xs text-foreground/55 shrink-0">Zoom</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="flex-1 accent-[hsl(var(--primary))]"
        />
      </div>
      <div className="flex gap-2 w-full max-w-xs">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full border border-border py-2.5 text-sm font-bold hover:bg-muted"
        >
          Annuler
        </button>
        <button
          onClick={confirm}
          className="flex-1 rounded-full brand-gradient text-white py-2.5 text-sm font-bold"
        >
          Valider
        </button>
      </div>
    </div>
  );
}