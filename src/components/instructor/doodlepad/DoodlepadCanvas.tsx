import { useRef, useEffect, useCallback, useState } from "react";
import type { Annotation, LatLng } from "./types";
import type { DrawingTool, DrawingColor } from "./DoodlepadToolbar";

interface Props {
  map: google.maps.Map;
  annotations: Annotation[];
  activeTool: DrawingTool;
  activeColor: DrawingColor;
  lineWidth: number;
  isDrawing: boolean;
  onAddAnnotation: (a: Annotation) => void;
}

/**
 * Convert a LatLng to pixel coordinates relative to the map container.
 * Uses the map's projection and bounds for accurate geo-anchored rendering.
 */
function latLngToPixel(
  map: google.maps.Map,
  ll: LatLng
): { x: number; y: number } | null {
  const projection = map.getProjection();
  if (!projection) return null;
  const bounds = map.getBounds();
  if (!bounds) return null;

  const zoom = map.getZoom()!;
  const scale = Math.pow(2, zoom);

  const worldPoint = projection.fromLatLngToPoint(
    new google.maps.LatLng(ll.lat, ll.lng)
  )!;

  const nw = projection.fromLatLngToPoint(bounds.getNorthEast())!;
  const sw = projection.fromLatLngToPoint(bounds.getSouthWest())!;

  // Top-left world point
  const topLeftX = sw.x;
  const topLeftY = nw.y;

  return {
    x: (worldPoint.x - topLeftX) * scale,
    y: (worldPoint.y - topLeftY) * scale,
  };
}

/**
 * Convert pixel coordinates (relative to map container) back to LatLng.
 */
function pixelToLatLng(
  map: google.maps.Map,
  px: number,
  py: number
): LatLng | null {
  const projection = map.getProjection();
  if (!projection) return null;
  const bounds = map.getBounds();
  if (!bounds) return null;

  const zoom = map.getZoom()!;
  const scale = Math.pow(2, zoom);

  const nw = projection.fromLatLngToPoint(bounds.getNorthEast())!;
  const sw = projection.fromLatLngToPoint(bounds.getSouthWest())!;

  const topLeftX = sw.x;
  const topLeftY = nw.y;

  const worldPoint = new google.maps.Point(
    px / scale + topLeftX,
    py / scale + topLeftY
  );

  const ll = projection.fromPointToLatLng(worldPoint)!;
  return { lat: ll.lat(), lng: ll.lng() };
}

export function DoodlepadCanvas({
  map,
  annotations,
  activeTool,
  activeColor,
  lineWidth,
  isDrawing,
  onAddAnnotation,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStroke = useRef<LatLng[]>([]);
  const startPoint = useRef<LatLng | null>(null);
  const [drawing, setDrawing] = useState(false);

  // Create canvas overlay
  useEffect(() => {
    const container = map.getDiv();
    let canvas = container.querySelector(".doodlepad-canvas") as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "doodlepad-canvas";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "1";
      canvas.style.pointerEvents = "none";
      container.style.position = "relative";
      container.appendChild(canvas);
    }
    canvasRef.current = canvas;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
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
    const listener = map.addListener("idle", () => redraw());
    const boundsListener = map.addListener("bounds_changed", () => redraw());
    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.removeListener(boundsListener);
    };
  }, [map, annotations]); // eslint-disable-line

  useEffect(() => {
    redraw();
  }, [annotations]); // eslint-disable-line

  const toPixel = useCallback(
    (ll: LatLng) => latLngToPixel(map, ll),
    [map]
  );

  const toLatLng = useCallback(
    (e: { clientX: number; clientY: number }): LatLng | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return pixelToLatLng(map, e.clientX - rect.left, e.clientY - rect.top);
    },
    [map]
  );

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
        if (!first) continue;
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < ann.points.length; i++) {
          const p = toPixel(ann.points[i]);
          if (!p) continue;
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      if ((ann.tool === "line" || ann.tool === "arrow") && ann.points && ann.points.length === 2) {
        const a = toPixel(ann.points[0]);
        const b = toPixel(ann.points[1]);
        if (!a || !b) continue;
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
        if (!cp) continue;
        // Calculate edge point at radiusMeters east of center
        const earthRadius = 6371000;
        const dLng = (ann.radiusMeters / earthRadius) * (180 / Math.PI) / Math.cos(ann.center.lat * Math.PI / 180);
        const edgeLL: LatLng = { lat: ann.center.lat, lng: ann.center.lng + dLng };
        const ep = toPixel(edgeLL);
        if (!ep) continue;
        const rx = Math.abs(ep.x - cp.x);
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, rx, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (ann.tool === "text" && ann.position && ann.text) {
        const p = toPixel(ann.position);
        if (!p) continue;
        ctx.font = `bold ${ann.fontSize || 16}px sans-serif`;
        ctx.fillText(ann.text, p.x, p.y);
      }
    }
  }, [annotations, map, toPixel]);

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
      if (!ll) return;

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
      if (!ll) return;

      if (activeTool === "pen") {
        currentStroke.current.push(ll);
        const ctx = canvas.getContext("2d");
        if (ctx && currentStroke.current.length > 1) {
          redraw();
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          const first = toPixel(currentStroke.current[0]);
          if (first) {
            ctx.moveTo(first.x, first.y);
            for (let i = 1; i < currentStroke.current.length; i++) {
              const p = toPixel(currentStroke.current[i]);
              if (p) ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
          }
        }
      } else if (activeTool === "line" || activeTool === "arrow") {
        redraw();
        const ctx = canvas.getContext("2d");
        if (ctx && startPoint.current) {
          const a = toPixel(startPoint.current);
          const b = toPixel(ll);
          if (a && b) {
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
        }
      } else if (activeTool === "circle") {
        redraw();
        const ctx = canvas.getContext("2d");
        if (ctx && startPoint.current) {
          const a = toPixel(startPoint.current);
          const b = toPixel(ll);
          if (a && b) {
            const r = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
            ctx.stroke();
          }
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
        let endLL: LatLng | null;
        if ("changedTouches" in e) {
          endLL = toLatLng({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
        } else {
          endLL = toLatLng(getEventPos(e));
        }
        if (endLL) {
          onAddAnnotation({
            id: crypto.randomUUID(),
            tool: activeTool,
            color: activeColor,
            lineWidth,
            points: [startPoint.current, endLL],
          });
        }
        startPoint.current = null;
      } else if (activeTool === "circle" && startPoint.current) {
        let endLL: LatLng | null;
        if ("changedTouches" in e) {
          endLL = toLatLng({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
        } else {
          endLL = toLatLng(getEventPos(e));
        }
        if (endLL) {
          // Haversine distance
          const R = 6371000;
          const dLat = (endLL.lat - startPoint.current.lat) * Math.PI / 180;
          const dLon = (endLL.lng - startPoint.current.lng) * Math.PI / 180;
          const a2 = Math.sin(dLat / 2) ** 2 + Math.cos(startPoint.current.lat * Math.PI / 180) * Math.cos(endLL.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
          onAddAnnotation({
            id: crypto.randomUUID(),
            tool: "circle",
            color: activeColor,
            lineWidth,
            center: startPoint.current,
            radiusMeters: dist,
          });
        }
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
  }, [isDrawing, drawing, activeTool, activeColor, lineWidth, annotations, map, onAddAnnotation, redraw, toLatLng, toPixel]); // eslint-disable-line

  return null;
}
