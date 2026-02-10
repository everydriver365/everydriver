import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Eye, Edit3, Upload, X, ImageIcon } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";

interface ImageSlot {
  label: string;
  description: string;
  dataUrl: string | null;
}

const DEFAULT_TEMPLATE = {
  title: "Quartix Plug & Track – Setup Guide",
  subtitle: "OBD Tracker Installation Instructions",
  installationSteps: `1. Locate the OBD-II (On-Board Diagnostics) port in the vehicle. This is usually found beneath the dashboard on the driver's side, near the steering column.

2. With the ignition OFF, plug the Quartix Plug & Track device firmly into the OBD-II port. Ensure it clicks securely into place.

3. Turn the vehicle ignition ON (you do not need to start the engine). The device LED should illuminate, indicating power.

4. The device will automatically register with the Quartix system. Allow up to 5 minutes for the initial GPS fix.

5. Once the LED shows a steady or slow-flashing pattern, the device is connected and tracking.`,
  deviceSetup: `Serial Number & Registration:
Each device has a unique serial number printed on its label. When registering the device on the Quartix platform, you will need this serial number.

If you need support, contact:
• Email: support@quartix.com
• Phone: 01onal 686 8815
• Website: www.quartix.com/support

Your Quartix account credentials will be provided separately. Log in at https://qsw.quartix.com to view live tracking, trip history, and driver scores.`,
  safetySummary: `• Do not force the device into the OBD port – if it does not fit, check you have the correct port.
• The device should not obstruct pedal operation or driver movement.
• Do not attempt to disassemble or modify the device.
• If the device becomes hot to touch, remove it immediately and contact support.
• The device is designed for 12V passenger vehicles only. Do not use on 24V commercial vehicles without checking compatibility.`,
  compatibilityNotes: `The Quartix Plug & Track is compatible with most vehicles manufactured from 2004 onwards that have a standard 16-pin OBD-II port.

Some older vehicles or certain makes may have the OBD port in a non-standard location. Refer to your vehicle handbook or contact Quartix support if you cannot locate the port.

Hybrid and electric vehicles: The device is compatible with most hybrid vehicles. For fully electric vehicles, please check with Quartix support before installation.`,
  additionalNotes: "",
};

export default function InstructorDocumentTemplates() {
  const { instructor } = useInstructorAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  // Editable fields
  const [title, setTitle] = useState(DEFAULT_TEMPLATE.title);
  const [subtitle, setSubtitle] = useState(DEFAULT_TEMPLATE.subtitle);
  const [installationSteps, setInstallationSteps] = useState(DEFAULT_TEMPLATE.installationSteps);
  const [deviceSetup, setDeviceSetup] = useState(DEFAULT_TEMPLATE.deviceSetup);
  const [safetySummary, setSafetySummary] = useState(DEFAULT_TEMPLATE.safetySummary);
  const [compatibilityNotes, setCompatibilityNotes] = useState(DEFAULT_TEMPLATE.compatibilityNotes);
  const [additionalNotes, setAdditionalNotes] = useState(DEFAULT_TEMPLATE.additionalNotes);

  // Image slots
  const [images, setImages] = useState<ImageSlot[]>([
    { label: "Header Logo", description: "Your company logo for the document header", dataUrl: null },
    { label: "OBD Port Diagram", description: "Photo/diagram showing the OBD port location", dataUrl: null },
    { label: "Device Photo", description: "Photo of the tracking device", dataUrl: null },
  ]);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleImageUpload = (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => prev.map((img, i) => i === index ? { ...img, dataUrl: e.target?.result as string } : img));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, dataUrl: null } : img));
  };

  const generatePDF = (): Blob => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [33, 33, 33]) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentWidth);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += fontSize * 0.5;
      }
      y += 4;
    };

    const addSection = (heading: string, body: string) => {
      if (y > 250) { doc.addPage(); y = 20; }
      y += 4;
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentWidth, y);
      y += 8;
      addText(heading, 14, true, [59, 130, 246]);
      y += 2;
      addText(body, 10);
    };

    // Header logo
    const logo = images[0]?.dataUrl;
    if (logo) {
      try { doc.addImage(logo, "PNG", margin, y, 40, 20); y += 26; } catch { /* skip */ }
    }

    // Title
    addText(title, 20, true, [30, 64, 175]);
    addText(subtitle, 12, false, [100, 100, 100]);
    y += 4;

    // OBD port diagram
    const obdImage = images[1]?.dataUrl;
    if (obdImage) {
      try {
        if (y > 200) { doc.addPage(); y = 20; }
        doc.addImage(obdImage, "PNG", margin, y, 80, 50);
        y += 56;
      } catch { /* skip */ }
    }

    addSection("Installation Steps", installationSteps);

    // Device photo
    const deviceImage = images[2]?.dataUrl;
    if (deviceImage) {
      try {
        if (y > 200) { doc.addPage(); y = 20; }
        doc.addImage(deviceImage, "PNG", margin, y, 60, 40);
        y += 46;
      } catch { /* skip */ }
    }

    addSection("Device Setup & Registration", deviceSetup);
    addSection("Safety Summary", safetySummary);
    addSection("Compatibility Notes", compatibilityNotes);

    if (additionalNotes.trim()) {
      addSection("Additional Notes", additionalNotes);
    }

    // Footer
    if (y > 270) { doc.addPage(); y = 20; }
    y = 280;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated ${new Date().toLocaleDateString("en-GB")}`, margin, y);

    return doc.output("blob");
  };

  const handleSaveToResources = async () => {
    if (!instructor?.id) {
      console.error("Save failed: no instructor id");
      toast.error("Not logged in as instructor");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Auth user:", user?.id);
      if (!user) throw new Error("Not authenticated");

      const pdfBlob = generatePDF();
      console.log("PDF generated, size:", pdfBlob.size);
      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 50)}.pdf`;
      const filePath = `${user.id}/${Date.now()}-${fileName}`;

      console.log("Uploading to path:", filePath);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("instructor-resources")
        .upload(filePath, pdfBlob, { contentType: "application/pdf" });
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      console.log("Upload success:", uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from("instructor-resources")
        .getPublicUrl(filePath);
      console.log("Public URL:", publicUrl);

      const { error: dbError } = await supabase
        .from("instructor_resources" as any)
        .insert([{
          instructor_id: instructor.id,
          title,
          description: subtitle,
          file_url: publicUrl,
          file_name: fileName,
          file_type: "application/pdf",
          file_size_bytes: pdfBlob.size,
          category: "training",
        }]);
      if (dbError) {
        console.error("DB insert error:", dbError);
        throw dbError;
      }

      toast.success("Document saved to Resources!");
      navigate("/instructor/resources");
    } catch (err: any) {
      console.error("Save to resources failed:", err);
      toast.error(err.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/instructor/resources")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Document Templates</h1>
            <p className="text-sm text-muted-foreground">Edit & save to Resources</p>
          </div>
          <Button size="sm" onClick={handleSaveToResources} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save to Resources"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1 gap-1.5"><Edit3 className="h-3.5 w-3.5" />Edit</TabsTrigger>
            <TabsTrigger value="images" className="flex-1 gap-1.5"><ImageIcon className="h-3.5 w-3.5" />Images</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 gap-1.5"><Eye className="h-3.5 w-3.5" />Preview</TabsTrigger>
          </TabsList>

          {/* EDIT TAB */}
          <TabsContent value="edit" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Document Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Installation Steps</Label>
                  <Textarea value={installationSteps} onChange={e => setInstallationSteps(e.target.value)} rows={10} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Device Setup & Registration</Label>
                  <Textarea value={deviceSetup} onChange={e => setDeviceSetup(e.target.value)} rows={8} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Safety Summary</Label>
                  <Textarea value={safetySummary} onChange={e => setSafetySummary(e.target.value)} rows={6} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Compatibility Notes</Label>
                  <Textarea value={compatibilityNotes} onChange={e => setCompatibilityNotes(e.target.value)} rows={5} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Additional Notes (optional)</Label>
                  <Textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} rows={4} placeholder="Add any extra instructions for your pupils..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IMAGES TAB */}
          <TabsContent value="images" className="space-y-4 mt-4">
            {images.map((img, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Label className="font-medium">{img.label}</Label>
                      <p className="text-xs text-muted-foreground mb-3">{img.description}</p>
                      {img.dataUrl ? (
                        <div className="relative inline-block">
                          <img src={img.dataUrl} alt={img.label} className="max-h-32 rounded-lg border object-contain" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => fileInputRefs.current[index]?.click()}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Upload Image
                        </Button>
                      )}
                      <input
                        ref={el => { fileInputRefs.current[index] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(index, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground text-center">Images will be embedded in the generated PDF. Max 5MB each.</p>
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                {images[0]?.dataUrl && (
                  <img src={images[0].dataUrl} alt="Logo" className="h-12 object-contain" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-primary">{title}</h1>
                  <p className="text-muted-foreground">{subtitle}</p>
                </div>

                {images[1]?.dataUrl && (
                  <img src={images[1].dataUrl} alt="OBD Port" className="max-h-40 rounded-lg border object-contain" />
                )}

                <div>
                  <h2 className="text-lg font-semibold text-primary border-b border-primary/20 pb-1 mb-2">Installation Steps</h2>
                  <p className="text-sm whitespace-pre-line">{installationSteps}</p>
                </div>

                {images[2]?.dataUrl && (
                  <img src={images[2].dataUrl} alt="Device" className="max-h-32 rounded-lg border object-contain" />
                )}

                <div>
                  <h2 className="text-lg font-semibold text-primary border-b border-primary/20 pb-1 mb-2">Device Setup & Registration</h2>
                  <p className="text-sm whitespace-pre-line">{deviceSetup}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-primary border-b border-primary/20 pb-1 mb-2">Safety Summary</h2>
                  <p className="text-sm whitespace-pre-line">{safetySummary}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-primary border-b border-primary/20 pb-1 mb-2">Compatibility Notes</h2>
                  <p className="text-sm whitespace-pre-line">{compatibilityNotes}</p>
                </div>

                {additionalNotes.trim() && (
                  <div>
                    <h2 className="text-lg font-semibold text-primary border-b border-primary/20 pb-1 mb-2">Additional Notes</h2>
                    <p className="text-sm whitespace-pre-line">{additionalNotes}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground pt-4 border-t">Generated {new Date().toLocaleDateString("en-GB")}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
