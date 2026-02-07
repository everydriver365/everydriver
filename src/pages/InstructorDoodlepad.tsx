import { useState, useEffect, useCallback } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { DoodlepadMap } from "@/components/instructor/doodlepad/DoodlepadMap";
import { DoodlepadToolbar, DrawingTool, DrawingColor } from "@/components/instructor/doodlepad/DoodlepadToolbar";
import { SavedAnnotationsDrawer } from "@/components/instructor/doodlepad/SavedAnnotationsDrawer";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Annotation } from "@/components/instructor/doodlepad/types";

const UK_CENTER = { lat: 52.4862, lng: -1.8904 };

export default function InstructorDoodlepad() {
  const { instructor } = useInstructorAuth();
  const [center, setCenter] = useState(UK_CENTER);
  const [zoom, setZoom] = useState(16);
  const [geoLoading, setGeoLoading] = useState(true);

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawingTool>("pen");
  const [activeColor, setActiveColor] = useState<DrawingColor>("#ef4444");
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  // Saved annotations
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentName, setCurrentName] = useState("Untitled");
  const [currentDoodlepadId, setCurrentDoodlepadId] = useState<string | null>(null);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack([]);
  }, [annotations]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, annotations]);
    setAnnotations(prev);
    setUndoStack((u) => u.slice(0, -1));
  }, [undoStack, annotations]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, annotations]);
    setAnnotations(next);
    setRedoStack((r) => r.slice(0, -1));
  }, [redoStack, annotations]);

  const handleClear = useCallback(() => {
    pushUndo();
    setAnnotations([]);
  }, [pushUndo]);

  const handleAddAnnotation = useCallback(
    (annotation: Annotation) => {
      pushUndo();
      setAnnotations((prev) => [...prev, annotation]);
    },
    [pushUndo]
  );

  const handleSave = async () => {
    if (!instructor?.id) return;
    const payload = {
      instructor_id: instructor.id,
      name: currentName,
      center_lat: center.lat,
      center_lng: center.lng,
      zoom_level: zoom,
      annotations: annotations as any,
    };

    try {
      if (currentDoodlepadId) {
        const { error } = await supabase
          .from("doodlepads")
          .update(payload)
          .eq("id", currentDoodlepadId);
        if (error) throw error;
        toast.success("Doodlepad updated");
      } else {
        const { data, error } = await supabase
          .from("doodlepads")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setCurrentDoodlepadId(data.id);
        toast.success("Doodlepad saved");
      }
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleLoad = (doodlepad: {
    id: string;
    name: string;
    center_lat: number;
    center_lng: number;
    zoom_level: number;
    annotations: any;
  }) => {
    setCurrentDoodlepadId(doodlepad.id);
    setCurrentName(doodlepad.name);
    setCenter({ lat: doodlepad.center_lat, lng: doodlepad.center_lng });
    setZoom(doodlepad.zoom_level);
    setAnnotations(doodlepad.annotations || []);
    setUndoStack([]);
    setRedoStack([]);
    setDrawerOpen(false);
    toast.success(`Loaded "${doodlepad.name}"`);
  };

  const handleNew = () => {
    setCurrentDoodlepadId(null);
    setCurrentName("Untitled");
    setAnnotations([]);
    setUndoStack([]);
    setRedoStack([]);
  };

  return (
    <InstructorPortalLayout>
      <div className="relative -mx-4 md:mx-0 -mt-4 md:mt-0" style={{ height: "calc(100vh - 140px)" }}>
        <DoodlepadMap
          center={center}
          zoom={zoom}
          onZoomChange={setZoom}
          onCenterChange={setCenter}
          annotations={annotations}
          activeTool={activeTool}
          activeColor={activeColor}
          lineWidth={lineWidth}
          isDrawing={isDrawing}
          onAddAnnotation={handleAddAnnotation}
          geoLoading={geoLoading}
        />

        <DoodlepadToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          lineWidth={lineWidth}
          onLineWidthChange={setLineWidth}
          isDrawing={isDrawing}
          onToggleDrawing={() => setIsDrawing((d) => !d)}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onSave={handleSave}
          onLoad={() => setDrawerOpen(true)}
          onNew={handleNew}
          currentName={currentName}
          onNameChange={setCurrentName}
        />

        {instructor?.id && (
          <SavedAnnotationsDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            instructorId={instructor.id}
            onLoad={handleLoad}
          />
        )}
      </div>
    </InstructorPortalLayout>
  );
}
