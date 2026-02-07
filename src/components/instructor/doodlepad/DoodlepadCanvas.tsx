import { useRef, useEffect, useCallback, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Annotation, LatLng } from "./types";
import type { DrawingTool, DrawingColor } from "./DoodlepadToolbar";

interface Props {
  annotations: Annotation[];
  activeTool: DrawingTool;
  activeColor: DrawingColor;
  lineWidth: number;
  isDrawing: boolean;
  onAddAnnotation: (a: Annotation) => void;
}

export function DoodlepadCanvas({
  annotations,
  activeTool,
  activeColor,
  lineWidth,
  isDrawing,
  onAddAnnotation,
}: Props) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStroke = useRef<LatLng[]>([]);
  const startPoint = useRef<LatLng | null>(null);
  const [drawing, setDrawing] = useState(false);

  // Create canvas overlay
  useEffect(() => {
    const container = map.getContainer();
    let canvas = container.querySelector(".doodlepad-canvas") as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "doodlepad-canvas";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "500";
      canvas.style.pointerEvents = "none";
      container.appendChild(canvas);
    }
    canvasRef.current = canvas;

    const resize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      redraw();
    };
    resize();
    map.on("resize", resize);
    return () => {
      map.off("resize", resize);
    };
  }, [map]); // eslint-disable-line

  // Toggle pointer events based on drawing mode
  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.style.pointerEvents = isDrawing ? "auto" : "none";
    canvasRef.current.style.cursor = isDrawing ? "crosshair" : "default";
    canvasRef.current.style.touchAction = isDrawing ? "none" : "auto";
  }, [isDrawing]);

  // Redraw on map move/zoom
  useEffect(() => {
    const redrawHandler = () => redraw();
    map.on("move", redrawHandler);
    map.on("zoom", redrawHandler);
    return () => {
      map.off("move", redrawHandler);
      map.off("zoom", redrawHandler);
    };
  }, [map, annotations]); // eslint-disable-line

  useEffect(() => {
    redraw();
  }, [annotations]); // eslint-disable-line

  const toLatLng = (e: { clientX: number; clientY: number }): LatLng => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const point = L.point(e.clientX - rect.left, e.clientY - rect.top);
    const ll = map.containerPointToLatLng(point);
    return { lat: ll.lat, lng: ll.lng };
  };

  const toPixel = (ll: LatLng): { x: number; y: number } => {
    const p = map.latLngToContainerPoint(L.latLng(ll.lat, ll.lng));
    return { x: p.x, y: p.y };
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const ann of annotations) {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (ann.tool === "pen" && ann.points && ann.points.length > 1) {
        ctx.beginPath();
        const first = toPixel(ann.points[0]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < ann.points.length; i++) {
          const p = toPixel(ann.points[i]);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      if ((ann.tool === "line" || ann.tool === "arrow") && ann.points && ann.points.length === 2) {
        const a = toPixel(ann.points[0]);
        const b = toPixel(ann.points[1]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        if (ann.tool === "arrow") {
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          const headLen = 16;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - headLen * Math.cos(angle - Math.PI / 6), b.y - headLen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - headLen * Math.cos(angle + Math.PI / 6), b.y - headLen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      }

      if (ann.tool === "circle" && ann.center && ann.radiusMeters) {
        const cp = toPixel(ann.center);
        // Approximate radius in pixels
        const edgeLL = L.latLng(ann.center.lat, ann.center.lng).toBounds(ann.radiusMeters * 2);
        const ne = map.latLngToContainerPoint(edgeLL.getNorthEast());
        const sw = map.latLngToContainerPoint(edgeLL.getSouthWest());
        const rx = Math.abs(ne.x - sw.x) / 2;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, rx, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (ann.tool === "text" && ann.position && ann.text) {
        const p = toPixel(ann.position);
        ctx.font = `bold ${ann.fontSize || 16}px sans-serif`;
        ctx.fillText(ann.text, p.x, p.y);
      }
    }
  }, [annotations, map]); // eslint-disable-line

  // Drawing event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getEventPos = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      }
      return { clientX: e.clientX, clientY: e.clientY };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getEventPos(e);
      const ll = toLatLng(pos);

      if (activeTool === "text") {
        const text = prompt("Enter text:");
        if (text) {
          onAddAnnotation({
            id: crypto.randomUUID(),
            tool: "text",
            color: activeColor,
            lineWidth,
            text,
            position: ll,
            fontSize: 16,
          });
        }
        return;
      }

      setDrawing(true);
      if (activeTool === "pen") {
        currentStroke.current = [ll];
      } else {
        startPoint.current = ll;
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!drawing || !isDrawing) return;
      e.preventDefault();
      const pos = getEventPos(e);
      const ll = toLatLng(pos);

      if (activeTool === "pen") {
        currentStroke.current.push(ll);
        // Live preview
        const ctx = canvas.getContext("2d");
        if (ctx && currentStroke.current.length > 1) {
          redraw();
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          const first = toPixel(currentStroke.current[0]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < currentStroke.current.length; i++) {
            const p = toPixel(currentStroke.current[i]);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
      } else if (activeTool === "line" || activeTool === "arrow") {
        // Live preview line/arrow
        redraw();
        const ctx = canvas.getContext("2d");
        if (ctx && startPoint.current) {
          const a = toPixel(startPoint.current);
          const b = toPixel(ll);
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          if (activeTool === "arrow") {
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const headLen = 16;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - headLen * Math.cos(angle - Math.PI / 6), b.y - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - headLen * Math.cos(angle + Math.PI / 6), b.y - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
        }
      } else if (activeTool === "circle") {
        redraw();
        const ctx = canvas.getContext("2d");
        if (ctx && startPoint.current) {
          const a = toPixel(startPoint.current);
          const b = toPixel(ll);
          const r = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (!drawing || !isDrawing) return;
      e.preventDefault();
      setDrawing(false);

      if (activeTool === "pen" && currentStroke.current.length > 1) {
        onAddAnnotation({
          id: crypto.randomUUID(),
          tool: "pen",
          color: activeColor,
          lineWidth,
          points: [...currentStroke.current],
        });
        currentStroke.current = [];
      } else if ((activeTool === "line" || activeTool === "arrow") && startPoint.current) {
        const pos = getEventPos(e);
        // For touchend, use last known position
        let endLL: LatLng;
        if ("changedTouches" in e) {
          endLL = toLatLng({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
        } else {
          endLL = toLatLng(pos);
        }
        onAddAnnotation({
          id: crypto.randomUUID(),
          tool: activeTool,
          color: activeColor,
          lineWidth,
          points: [startPoint.current, endLL],
        });
        startPoint.current = null;
      } else if (activeTool === "circle" && startPoint.current) {
        let endLL: LatLng;
        if ("changedTouches" in e) {
          endLL = toLatLng({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
        } else {
          endLL = toLatLng(getEventPos(e));
        }
        const dist = map.distance(L.latLng(startPoint.current.lat, startPoint.current.lng), L.latLng(endLL.lat, endLL.lng));
        onAddAnnotation({
          id: crypto.randomUUID(),
          tool: "circle",
          color: activeColor,
          lineWidth,
          center: startPoint.current,
          radiusMeters: dist,
        });
        startPoint.current = null;
      }
    };

    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleEnd);
    };
  }, [isDrawing, drawing, activeTool, activeColor, lineWidth, annotations, map, onAddAnnotation, redraw]); // eslint-disable-line

  return null;
}
