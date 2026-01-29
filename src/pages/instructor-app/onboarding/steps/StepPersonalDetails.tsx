import { useState, useRef } from "react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepPersonalDetailsProps {
  data: {
    name: string;
    email: string;
    phone: string;
    bio: string;
    profile_image_url: string | null;
  };
  instructorId: string;
  onUpdate: (data: Partial<StepPersonalDetailsProps["data"]>) => void;
  onNext: () => void;
}

export function StepPersonalDetails({
  data,
  instructorId,
  onUpdate,
  onNext,
}: StepPersonalDetailsProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    if (!instructorId) {
      toast.error("Please wait, loading your profile...");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    // Always reset the input so selecting the same file again triggers onChange
    const resetInput = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    if (!instructorId) {
      toast.error("Please wait, loading your profile...");
      resetInput();
      return;
    }

    // Validate file type
    if (!file.type?.startsWith("image/")) {
      toast.error("Please choose an image file");
      resetInput();
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      resetInput();
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${instructorId}/profile-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(fileName);

      onUpdate({ profile_image_url: urlData.publicUrl });
      toast.success("Photo uploaded!");
    } catch (err: any) {
      console.error("Failed to upload photo:", err);
      toast.error(err?.message || "Failed to upload photo");
    } finally {
      setUploading(false);
      resetInput();
    }
  };

  const canProceed = data.name.trim().length >= 2 && data.phone.trim().length >= 10;

  return (
    <OnboardingLayout
      step={1}
      totalSteps={10}
      title="Tell Us About Yourself"
      description="Let's start with your basic information"
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Profile Photo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={data.profile_image_url || undefined} />
              <AvatarFallback className="bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              onClick={handleCameraClick}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Add a photo to help pupils recognise you
          </p>
        </div>

        {/* Name (pre-filled from signup) */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="John Smith"
          />
        </div>

        {/* Email (read-only, from signup) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            This is your login email and cannot be changed here
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="07700 900000"
          />
          <p className="text-xs text-muted-foreground">
            Pupils will use this to contact you
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">About You (Optional)</Label>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => onUpdate({ bio: e.target.value })}
            placeholder="Tell pupils a bit about yourself, your experience, and teaching style..."
            rows={4}
          />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        showBack={false}
        canProceed={canProceed}
        nextLabel="Continue"
      />
    </OnboardingLayout>
  );
}
