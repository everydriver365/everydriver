import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, Car } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface CarStickerGeneratorProps {
  instructorName: string;
  instructorPhone: string | null;
  instructorSlug: string | null;
  logoUrl: string | null;
  brandColour: string | null;
  customDomain: string | null;
}

export function CarStickerGenerator({
  instructorName,
  instructorPhone,
  instructorSlug,
  logoUrl,
  brandColour,
}: CarStickerGeneratorProps) {
  const [tagline, setTagline] = useState("Book your driving lessons today!");
  const [stickerSize, setStickerSize] = useState<"a5" | "a6">("a6");
  const [generating, setGenerating] = useState(false);

  const bookingUrl = instructorSlug
    ? `${window.location.origin}/i/${instructorSlug}`
    : null;

  const generateSticker = async () => {
    setGenerating(true);
    try {
      // A6 = 105x148mm, A5 = 148x210mm
      const width = stickerSize === "a6" ? 105 : 148;
      const height = stickerSize === "a6" ? 148 : 210;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [width, height],
      });

      const brandHex = brandColour || "#1877F2";
      const r = parseInt(brandHex.slice(1, 3), 16);
      const g = parseInt(brandHex.slice(3, 5), 16);
      const b = parseInt(brandHex.slice(5, 7), 16);

      // Background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, "F");

      // Brand colour header bar
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, width, height * 0.08, "F");

      // Brand colour footer bar
      pdf.setFillColor(r, g, b);
      pdf.rect(0, height * 0.92, width, height * 0.08, "F");

      // Side accent lines
      pdf.setDrawColor(r, g, b);
      pdf.setLineWidth(1.5);
      pdf.line(4, height * 0.1, 4, height * 0.9);
      pdf.line(width - 4, height * 0.1, width - 4, height * 0.9);

      let yPos = height * 0.15;

      // Logo
      if (logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = logoUrl;
          });
          const logoSize = width * 0.25;
          pdf.addImage(img, "PNG", (width - logoSize) / 2, yPos, logoSize, logoSize);
          yPos += logoSize + 6;
        } catch {
          // Skip logo if load fails
        }
      }

      // Instructor name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(stickerSize === "a6" ? 16 : 22);
      pdf.setTextColor(r, g, b);
      pdf.text(instructorName, width / 2, yPos, { align: "center" });
      yPos += stickerSize === "a6" ? 8 : 10;

      // Car icon placeholder text
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(stickerSize === "a6" ? 10 : 13);
      pdf.setTextColor(80, 80, 80);
      pdf.text("🚗 Driving Instructor", width / 2, yPos, { align: "center" });
      yPos += stickerSize === "a6" ? 10 : 14;

      // Tagline
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(stickerSize === "a6" ? 11 : 14);
      pdf.setTextColor(40, 40, 40);
      const taglineLines = pdf.splitTextToSize(tagline, width - 20);
      pdf.text(taglineLines, width / 2, yPos, { align: "center" });
      yPos += taglineLines.length * (stickerSize === "a6" ? 5 : 7) + 8;

      // Phone
      if (instructorPhone) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(stickerSize === "a6" ? 14 : 18);
        pdf.setTextColor(r, g, b);
        pdf.text(`📞 ${instructorPhone}`, width / 2, yPos, { align: "center" });
        yPos += stickerSize === "a6" ? 10 : 14;
      }

      // QR Code (using Google Charts API)
      if (bookingUrl) {
        const qrSize = stickerSize === "a6" ? 35 : 50;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingUrl)}`;
        try {
          const qrImg = new Image();
          qrImg.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            qrImg.onload = () => resolve();
            qrImg.onerror = reject;
            qrImg.src = qrUrl;
          });
          pdf.addImage(qrImg, "PNG", (width - qrSize) / 2, yPos, qrSize, qrSize);
          yPos += qrSize + 4;
        } catch {
          // Skip QR if load fails
        }

        // URL text below QR
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(stickerSize === "a6" ? 7 : 9);
        pdf.setTextColor(100, 100, 100);
        pdf.text("Scan to book online", width / 2, yPos, { align: "center" });
      }

      pdf.save(`${instructorName.replace(/\s+/g, "-").toLowerCase()}-car-sticker.pdf`);
      toast.success("Sticker PDF downloaded!");
    } catch (error) {
      console.error("Error generating sticker:", error);
      toast.error("Failed to generate sticker");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-primary" />
          Car Window Sticker
        </CardTitle>
        <CardDescription>
          Generate a branded sticker with QR code for your car window
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tagline</Label>
          <Input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Book your driving lessons today!"
          />
        </div>

        <div className="space-y-2">
          <Label>Sticker Size</Label>
          <Select value={stickerSize} onValueChange={(v) => setStickerSize(v as "a5" | "a6")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a6">A6 (105 × 148mm) — Small</SelectItem>
              <SelectItem value="a5">A5 (148 × 210mm) — Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border p-4 bg-muted/30 space-y-2 text-sm">
          <p><strong>Preview info:</strong></p>
          <p>👤 {instructorName}</p>
          {instructorPhone && <p>📞 {instructorPhone}</p>}
          {bookingUrl && <p>🔗 {bookingUrl}</p>}
          {logoUrl && <p>✅ Logo included</p>}
          {brandColour && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: brandColour }} />
              <span>Brand colour applied</span>
            </div>
          )}
        </div>

        <Button onClick={generateSticker} disabled={generating} className="w-full gap-2">
          {generating ? (
            <Download className="h-4 w-4 animate-bounce" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Download Sticker PDF"}
        </Button>
      </CardContent>
    </Card>
  );
}
