import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractedData {
  amount: number | null;
  date: string | null;
  category: string | null;
  vendor: string | null;
}

interface ReceiptScannerProps {
  instructorId: string;
  onExtracted: (data: ExtractedData, imageUrl: string) => void;
}

export function ReceiptScanner({ instructorId, onExtracted }: ReceiptScannerProps) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Upload to storage
      const fileName = `${instructorId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("expense-receipts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("expense-receipts")
        .getPublicUrl(uploadData.path);

      const imageUrl = urlData.publicUrl;
      setUploading(false);

      // AI extraction
      setExtracting(true);
      const { data: extractData, error: extractError } = await supabase.functions.invoke(
        "extract-receipt",
        { body: { imageUrl } }
      );

      if (extractError) {
        console.error("Extract error:", extractError);
        // Still pass the image URL even if extraction fails
        onExtracted({ amount: null, date: null, category: null, vendor: null }, imageUrl);
        toast.info("Receipt uploaded but auto-extraction failed. Please fill in details manually.");
      } else {
        onExtracted(extractData.data, imageUrl);
        toast.success("Receipt scanned successfully!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload receipt");
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const isProcessing = uploading || extracting;

  return (
    <div className="space-y-3">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {preview ? (
        <Card className="overflow-hidden">
          <CardContent className="p-2 relative">
            <img src={preview} alt="Receipt" className="w-full rounded-md max-h-48 object-contain" />
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                      AI extracting details...
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => cameraRef.current?.click()}
            disabled={isProcessing}
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => fileRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
