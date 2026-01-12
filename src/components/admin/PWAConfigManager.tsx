import { useState } from "react";
import { usePWAConfigs, useUpdatePWAConfig, PWAConfig } from "@/hooks/usePWAConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Smartphone, Users, UserCheck, Palette, Save, ExternalLink } from "lucide-react";

interface ConfigFormProps {
  config: PWAConfig;
  onUpdate: (updates: Partial<PWAConfig> & { id: string }) => void;
  isUpdating: boolean;
}

function ConfigForm({ config, onUpdate, isUpdating }: ConfigFormProps) {
  const [formData, setFormData] = useState({
    app_name: config.app_name,
    short_name: config.short_name,
    description: config.description || "",
    theme_color: config.theme_color,
    background_color: config.background_color,
    start_url: config.start_url,
    is_active: config.is_active,
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = () => {
    onUpdate({
      id: config.id,
      ...formData,
    });
  };

  const handleIconUpload = async (file: File, size: '192' | '512') => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `pwa-${config.app_type}-${size}.${fileExt}`;
      const filePath = `pwa-icons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(filePath);

      const updateField = size === '192' ? 'icon_192_url' : 'icon_512_url';
      onUpdate({
        id: config.id,
        [updateField]: urlData.publicUrl,
      });

      toast.success(`${size}x${size} icon uploaded`);
    } catch (error) {
      console.error("Error uploading icon:", error);
      toast.error("Failed to upload icon");
    } finally {
      setIsUploading(false);
    }
  };

  const appTypeIcons = {
    instructor: Smartphone,
    pupil: Users,
    parent: UserCheck,
  };

  const AppIcon = appTypeIcons[config.app_type];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <AppIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold capitalize">{config.app_type} App</h3>
          <p className="text-sm text-muted-foreground">Configure how the app appears when installed</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor={`active-${config.id}`} className="text-sm">Active</Label>
          <Switch
            id={`active-${config.id}`}
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* App Name */}
        <div className="space-y-2">
          <Label htmlFor={`name-${config.id}`}>App Name</Label>
          <Input
            id={`name-${config.id}`}
            value={formData.app_name}
            onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
            placeholder="DL Instructor"
          />
          <p className="text-xs text-muted-foreground">Full name shown in app launcher</p>
        </div>

        {/* Short Name */}
        <div className="space-y-2">
          <Label htmlFor={`short-${config.id}`}>Short Name</Label>
          <Input
            id={`short-${config.id}`}
            value={formData.short_name}
            onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
            placeholder="DL Inst"
            maxLength={12}
          />
          <p className="text-xs text-muted-foreground">Displayed under home screen icon (max 12 chars)</p>
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`desc-${config.id}`}>Description</Label>
          <Textarea
            id={`desc-${config.id}`}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Manage your driving lessons..."
            rows={2}
          />
        </div>

        {/* Theme Color */}
        <div className="space-y-2">
          <Label htmlFor={`theme-${config.id}`} className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme Color
          </Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id={`theme-${config.id}`}
              value={formData.theme_color}
              onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
              className="h-10 w-14 cursor-pointer p-1"
            />
            <Input
              value={formData.theme_color}
              onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
              placeholder="#1e3a5f"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">Browser toolbar & splash screen color</p>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor={`bg-${config.id}`} className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Background Color
          </Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id={`bg-${config.id}`}
              value={formData.background_color}
              onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
              className="h-10 w-14 cursor-pointer p-1"
            />
            <Input
              value={formData.background_color}
              onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">App splash screen background</p>
        </div>

        {/* Start URL */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`start-${config.id}`}>Start URL</Label>
          <Input
            id={`start-${config.id}`}
            value={formData.start_url}
            onChange={(e) => setFormData({ ...formData, start_url: e.target.value })}
            placeholder="/instructor"
          />
          <p className="text-xs text-muted-foreground">The page that opens when the app is launched</p>
        </div>
      </div>

      {/* Icons Section */}
      <div className="space-y-4">
        <h4 className="font-medium">App Icons</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 192x192 Icon */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">192×192 Icon</span>
              <span className="text-xs text-muted-foreground">Required</span>
            </div>
            {config.icon_192_url ? (
              <div className="mb-3 flex justify-center">
                <img
                  src={config.icon_192_url}
                  alt="192x192 icon"
                  className="h-24 w-24 rounded-xl object-cover shadow-md"
                />
              </div>
            ) : (
              <div className="mb-3 flex h-24 w-24 mx-auto items-center justify-center rounded-xl bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <Input
              type="file"
              accept="image/png,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleIconUpload(file, '192');
              }}
              disabled={isUploading}
              className="text-sm"
            />
          </div>

          {/* 512x512 Icon */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">512×512 Icon</span>
              <span className="text-xs text-muted-foreground">Required</span>
            </div>
            {config.icon_512_url ? (
              <div className="mb-3 flex justify-center">
                <img
                  src={config.icon_512_url}
                  alt="512x512 icon"
                  className="h-24 w-24 rounded-xl object-cover shadow-md"
                />
              </div>
            ) : (
              <div className="mb-3 flex h-24 w-24 mx-auto items-center justify-center rounded-xl bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <Input
              type="file"
              accept="image/png,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleIconUpload(file, '512');
              }}
              disabled={isUploading}
              className="text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload PNG or SVG icons. 192×192 for home screen, 512×512 for splash screen.
        </p>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`${config.start_url}/install`, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Preview Install Page
        </Button>
        <Button onClick={handleSave} disabled={isUpdating}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export function PWAConfigManager() {
  const { data: configs, isLoading } = usePWAConfigs();
  const updateConfig = useUpdatePWAConfig();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No app configurations found.
      </div>
    );
  }

  return (
    <Tabs defaultValue="instructor" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="instructor" className="gap-2">
          <Smartphone className="h-4 w-4" />
          Instructor
        </TabsTrigger>
        <TabsTrigger value="pupil" className="gap-2">
          <Users className="h-4 w-4" />
          Pupil
        </TabsTrigger>
        <TabsTrigger value="parent" className="gap-2">
          <UserCheck className="h-4 w-4" />
          Parent
        </TabsTrigger>
      </TabsList>

      {configs.map((config) => (
        <TabsContent key={config.id} value={config.app_type}>
          <ConfigForm
            config={config}
            onUpdate={(updates) => updateConfig.mutate(updates)}
            isUpdating={updateConfig.isPending}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
