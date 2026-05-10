import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  open: boolean;
  file: File | null;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

const SIZE = 280; // preview crop area (square)
const OUT_SIZE = 512;

export function AvatarRepositionDialog({ open, file, saving, onCancel, onConfirm }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setImg(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      const m = SIZE / Math.min(i.width, i.height);
      setMinScale(m);
      setScale(m);
      setOffset({ x: 0, y: 0 });
      setImg(i);
    };
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clamp = (sc: number, off: { x: number; y: number }) => {
    if (!img) return off;
    const w = img.width * sc;
    const h = img.height * sc;
    const maxX = (w - SIZE) / 2;
    const maxY = (h - SIZE) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, off.x)),
      y: Math.max(-maxY, Math.min(maxY, off.y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = dragRef.current.ox + (e.clientX - dragRef.current.x);
    const ny = dragRef.current.oy + (e.clientY - dragRef.current.y);
    setOffset(clamp(scale, { x: nx, y: ny }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleScaleChange = (v: number) => {
    setScale(v);
    setOffset((o) => clamp(v, o));
  };

  const handleConfirm = () => {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT_SIZE;
    canvas.height = OUT_SIZE;
    const ctx = canvas.getContext("2d")!;
    const ratio = OUT_SIZE / SIZE;
    const w = img.width * scale * ratio;
    const h = img.height * scale * ratio;
    const dx = OUT_SIZE / 2 - w / 2 + offset.x * ratio;
    const dy = OUT_SIZE / 2 - h / 2 + offset.y * ratio;
    ctx.drawImage(img, dx, dy, w, h);
    canvas.toBlob((b) => b && onConfirm(b), "image/jpeg", 0.92);
  };

  const renderW = img ? img.width * scale : 0;
  const renderH = img ? img.height * scale : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reposition photo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden rounded-full bg-muted touch-none select-none cursor-move"
            style={{ width: SIZE, height: SIZE }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {img && (
              <img
                src={img.src}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  width: renderW,
                  height: renderH,
                  left: SIZE / 2 - renderW / 2 + offset.x,
                  top: SIZE / 2 - renderH / 2 + offset.y,
                  maxWidth: "none",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
          <div className="w-full px-2">
            <Slider
              value={[scale]}
              min={minScale}
              max={minScale * 4}
              step={0.01}
              onValueChange={(v) => handleScaleChange(v[0])}
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Drag to reposition · slide to zoom
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !img}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
