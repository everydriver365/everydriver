import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera, Video, AlertTriangle, Download, Play, MapPin, Clock, Search,
  Image as ImageIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CoordsMapPreview } from "@/components/instructor/CoordsMapPreview";
import { DashcamVideoPlayer } from "./DashcamVideoPlayer";

interface DashcamMedia {
  id: string;
  geotab_media_file_id: string;
  media_type: string;
  file_name: string | null;
  duration_seconds: number | null;
  latitude: number | null;
  longitude: number | null;
  recorded_at: string;
  is_incident: boolean;
  status: string;
  thumbnail_url: string | null;
  device_id: string | null;
  created_at: string;
  instructor_id?: string;
}

interface DashcamGalleryViewProps {
  instructorId?: string;
  showAllInstructors?: boolean;
}

export function DashcamGalleryView({ instructorId, showAllInstructors = false }: DashcamGalleryViewProps) {
  const [media, setMedia] = useState<DashcamMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIncidents, setFilterIncidents] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "video" | "image">("all");
  const [selectedMedia, setSelectedMedia] = useState<DashcamMedia | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, [instructorId, showAllInstructors]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("dashcam_media")
        .select("id, geotab_media_file_id, media_type, file_name, duration_seconds, latitude, longitude, recorded_at, is_incident, status, thumbnail_url, device_id, created_at, instructor_id")
        .order("recorded_at", { ascending: false })
        .limit(200);

      if (!showAllInstructors && instructorId) {
        query = query.eq("instructor_id", instructorId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setMedia(data as unknown as DashcamMedia[]);
      }
    } catch (err) {
      console.error("Error fetching dashcam media:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (item: DashcamMedia) => {
    setDownloading(item.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geotab-media-download?mediaId=${item.id}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (res.redirected || res.status === 302) {
        window.open(res.url, "_blank");
      } else {
        const data = await res.json();
        if (data.downloadUrl) window.open(data.downloadUrl, "_blank");
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(null);
    }
  };

  const filteredMedia = media.filter((item) => {
    if (filterIncidents && !item.is_incident) return false;
    if (filterType !== "all" && item.media_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.file_name?.toLowerCase().includes(q) ||
        format(new Date(item.recorded_at), "PPp").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const incidentCount = media.filter((m) => m.is_incident).length;
  const videoCount = media.filter((m) => m.media_type === "video").length;

  return (
    <div className="space-y-4">
      {/* Stats & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/30">
            <Video className="h-3 w-3 mr-1" />
            {videoCount} Videos
          </Badge>
          {incidentCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {incidentCount} Incidents
            </Badge>
          )}
          <Badge variant="outline">
            {media.length} Total
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={filterIncidents ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterIncidents(!filterIncidents)}
          className={filterIncidents ? "bg-amber-500 hover:bg-amber-600" : ""}
        >
          <AlertTriangle className="h-4 w-4 mr-1" /> Incidents
        </Button>
        <Button
          variant={filterType === "video" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType(filterType === "video" ? "all" : "video")}
        >
          <Video className="h-4 w-4 mr-1" /> Videos
        </Button>
        <Button
          variant={filterType === "image" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType(filterType === "image" ? "all" : "image")}
        >
          <ImageIcon className="h-4 w-4 mr-1" /> Images
        </Button>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading footage...</div>
      ) : filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="font-semibold text-lg mb-2">No footage yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {media.length === 0
                ? "Dashcam clips will appear here once your Geotab device starts recording."
                : "No clips match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => setSelectedMedia(item)}
            >
              <div className="relative aspect-video bg-muted flex items-center justify-center">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.file_name || "Clip"} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground/50">
                    {item.media_type === "video" ? <Video className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" />}
                  </div>
                )}
                {item.media_type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-5 w-5 text-foreground ml-0.5" />
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {item.is_incident && (
                    <Badge className="bg-amber-500 text-white text-xs">
                      <AlertTriangle className="h-3 w-3 mr-0.5" /> Incident
                    </Badge>
                  )}
                </div>
                {item.duration_seconds && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {Math.floor(item.duration_seconds / 60)}:{String(item.duration_seconds % 60).padStart(2, "0")}
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">
                  {item.file_name || format(new Date(item.recorded_at), "PPp")}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(item.recorded_at), { addSuffix: true })}
                  </span>
                  {item.latitude && item.longitude && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> GPS</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMedia?.media_type === "video" ? (
                <Video className="h-5 w-5 text-sky-500" />
              ) : (
                <ImageIcon className="h-5 w-5 text-emerald-500" />
              )}
              {selectedMedia?.file_name || "Dashcam Clip"}
              {selectedMedia?.is_incident && (
                <Badge className="bg-amber-500 text-white ml-2">Incident</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              {selectedMedia.media_type === "video" ? (
                <DashcamVideoPlayer
                  mediaId={selectedMedia.id}
                  thumbnailUrl={selectedMedia.thumbnail_url}
                />
              ) : (
                <div className="aspect-video bg-muted rounded-none flex items-center justify-center border">
                  {selectedMedia.thumbnail_url ? (
                    <img src={selectedMedia.thumbnail_url} alt="Preview" className="w-full h-full object-contain rounded-none" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Click download to view the full image</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Recorded</span>
                  <p className="font-medium">{format(new Date(selectedMedia.recorded_at), "PPp")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium capitalize">{selectedMedia.media_type}</p>
                </div>
                {selectedMedia.duration_seconds && (
                  <div>
                    <span className="text-muted-foreground">Duration</span>
                    <p className="font-medium">{Math.floor(selectedMedia.duration_seconds / 60)}m {selectedMedia.duration_seconds % 60}s</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-medium capitalize">{selectedMedia.status}</p>
                </div>
              </div>
              {selectedMedia.latitude && selectedMedia.longitude && (
                <CoordsMapPreview latitude={selectedMedia.latitude} longitude={selectedMedia.longitude} expandable={false} className="h-[180px]" />
              )}
              <Button className="w-full" onClick={() => handleDownload(selectedMedia)} disabled={downloading === selectedMedia.id}>
                <Download className="h-4 w-4 mr-2" />
                {downloading === selectedMedia.id ? "Preparing download..." : "Download Original"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
