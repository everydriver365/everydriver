import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, Crop as CropIcon } from 'lucide-react';

interface CMSImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: string;
  folder?: string;
  label?: string;
  className?: string;
  aspectRatio?: number; // e.g., 16/9, 1, 4/3
  enableCrop?: boolean;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function CMSImageUpload({
  value,
  onChange,
  bucket,
  folder = '',
  label = 'Image',
  className = '',
  aspectRatio,
  enableCrop = true,
}: CMSImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<File | null>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const aspect = aspectRatio || 16 / 9;
    setCrop(centerAspectCrop(width, height, aspect));
  }, [aspectRatio]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    fileRef.current = file;

    if (enableCrop) {
      // Show crop dialog
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    } else {
      // Upload directly without cropping
      await uploadFile(file);
    }

    // Reset input
    e.target.value = '';
  };

  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop]);

  const uploadFile = async (file: File | Blob, originalName?: string) => {
    setUploading(true);
    try {
      const fileName = originalName || (fileRef.current?.name || 'image.jpg');
      const fileExt = fileName.split('.').pop() || 'jpg';
      const uploadName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uploadName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadName);

      onChange(urlData.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCropConfirm = async () => {
    const croppedBlob = await getCroppedImage();
    if (croppedBlob) {
      setCropDialogOpen(false);
      setImageSrc(null);
      await uploadFile(croppedBlob, fileRef.current?.name);
    } else {
      toast.error('Failed to crop image');
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setImageSrc(null);
    fileRef.current = null;
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {label && <Label className="text-xs">{label}</Label>}
        
        {value ? (
          <div className="relative rounded-lg border overflow-hidden">
            <img
              src={value}
              alt="Preview"
              className="w-full h-32 object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload</span>
                <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => !open && handleCropCancel()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Crop Image
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center max-h-[60vh] overflow-auto">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </ReactCrop>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCropCancel}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm} disabled={!completedCrop || uploading}>
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Apply & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
