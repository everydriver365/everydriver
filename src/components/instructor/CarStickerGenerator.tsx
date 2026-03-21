import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, Car, Eye } from "lucide-react";
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

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function lightenColor(r: number, g: number, b: number, factor: number) {
  return {
    r: Math.min(255, Math.round(r + (255 - r) * factor)),
    g: Math.min(255, Math.round(g + (255 - g) * factor)),
    b: Math.min(255, Math.round(b + (255 - b) * factor)),
  };
}

function drawRoundedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, radius: number) {
  pdf.roundedRect(x, y, w, h, radius, radius, "F");
}

export function CarStickerGenerator({
  instructorName,
  instructorPhone,
  instructorSlug,
  logoUrl,
  brandColour,
  customDomain,
}: CarStickerGeneratorProps) {
  const [tagline, setTagline] = useState("Book your driving lessons today!");
  const [stickerSize, setStickerSize] = useState<"a5" | "a6">("a6");
  const [generating, setGenerating] = useState(false);

  const bookingUrl = customDomain
    ? `https://${customDomain}`
    : instructorSlug
      ? `https://${instructorSlug}.drive365.co.uk`
      : null;

  const displayDomain = customDomain
    || (instructorSlug ? `${instructorSlug}.drive365.co.uk` : null);

  const generateSticker = async () => {
    setGenerating(true);
    try {
      const isA6 = stickerSize === "a6";
      const width = isA6 ? 105 : 148;
      const height = isA6 ? 148 : 210;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [width, height],
      });

      const brand = hexToRgb(brandColour || "#1877F2");
      const lightBrand = lightenColor(brand.r, brand.g, brand.b, 0.85);

      // === FULL BRAND BACKGROUND ===
      pdf.setFillColor(brand.r, brand.g, brand.b);
      pdf.rect(0, 0, width, height, "F");

      // === WHITE INNER CARD with rounded corners ===
      const margin = isA6 ? 6 : 8;
      const cardW = width - margin * 2;
      const cardH = height - margin * 2;
      pdf.setFillColor(255, 255, 255);
      drawRoundedRect(pdf, margin, margin, cardW, cardH, isA6 ? 6 : 8);

      // === TOP ACCENT BAR ===
      const barH = isA6 ? 5 : 7;
      pdf.setFillColor(brand.r, brand.g, brand.b);
      drawRoundedRect(pdf, margin, margin, cardW, barH + 4, isA6 ? 6 : 8);
      // Square off the bottom of the bar
      pdf.rect(margin, margin + 4, cardW, barH, "F");

      let yPos = margin + barH + (isA6 ? 10 : 14);

      // === LOGO ===
      if (logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = logoUrl;
          });
          const logoSize = isA6 ? 22 : 30;
          pdf.addImage(img, "PNG", (width - logoSize) / 2, yPos, logoSize, logoSize);
          yPos += logoSize + (isA6 ? 5 : 7);
        } catch {
          yPos += 2;
        }
      }

      // === INSTRUCTOR NAME (large, bold) ===
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(isA6 ? 18 : 24);
      pdf.setTextColor(brand.r, brand.g, brand.b);
      const nameLines = pdf.splitTextToSize(instructorName, cardW - 16);
      pdf.text(nameLines, width / 2, yPos, { align: "center" });
      yPos += nameLines.length * (isA6 ? 7 : 9) + (isA6 ? 3 : 4);

      // === DIVIDER LINE ===
      pdf.setDrawColor(lightBrand.r, lightBrand.g, lightBrand.b);
      pdf.setLineWidth(0.8);
      const divPad = isA6 ? 20 : 28;
      pdf.line(divPad, yPos, width - divPad, yPos);
      yPos += isA6 ? 5 : 7;

      // === SUBTITLE ===
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(isA6 ? 10 : 13);
      pdf.setTextColor(60, 60, 60);
      pdf.text("DRIVING INSTRUCTOR", width / 2, yPos, { align: "center" });
      yPos += isA6 ? 8 : 10;

      // === TAGLINE in brand pill ===
      const tagFontSize = isA6 ? 9 : 11;
      pdf.setFontSize(tagFontSize);
      const tagLines = pdf.splitTextToSize(tagline, cardW - 24);
      const pillH = tagLines.length * (tagFontSize * 0.4) + (isA6 ? 6 : 8);
      const pillW = cardW - (isA6 ? 16 : 20);
      pdf.setFillColor(lightBrand.r, lightBrand.g, lightBrand.b);
      drawRoundedRect(pdf, (width - pillW) / 2, yPos - (isA6 ? 3 : 4), pillW, pillH, 3);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(brand.r, brand.g, brand.b);
      pdf.text(tagLines, width / 2, yPos + 1, { align: "center" });
      yPos += pillH + (isA6 ? 6 : 8);

      // === PHONE NUMBER (big & bold) ===
      if (instructorPhone) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(isA6 ? 18 : 24);
        pdf.setTextColor(brand.r, brand.g, brand.b);
        pdf.text(instructorPhone, width / 2, yPos, { align: "center" });
        yPos += isA6 ? 10 : 14;
      }

      // === QR CODE ===
      if (bookingUrl) {
        const qrSize = isA6 ? 30 : 42;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=${brand.r.toString(16).padStart(2, '0')}${brand.g.toString(16).padStart(2, '0')}${brand.b.toString(16).padStart(2, '0')}&data=${encodeURIComponent(bookingUrl)}`;
        try {
          const qrImg = new Image();
          qrImg.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            qrImg.onload = () => resolve();
            qrImg.onerror = reject;
            qrImg.src = qrUrl;
          });
          // White background behind QR
          pdf.setFillColor(255, 255, 255);
          const qrPad = 2;
          drawRoundedRect(pdf, (width - qrSize) / 2 - qrPad, yPos - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2, 3);
          pdf.addImage(qrImg, "PNG", (width - qrSize) / 2, yPos, qrSize, qrSize);
          yPos += qrSize + (isA6 ? 4 : 5);
        } catch {
          // Skip QR if load fails
        }

        // === SCAN LABEL ===
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(isA6 ? 8 : 10);
        pdf.setTextColor(80, 80, 80);
        pdf.text("SCAN TO BOOK ONLINE", width / 2, yPos, { align: "center" });
        yPos += isA6 ? 4 : 5;

        // === DOMAIN URL ===
        if (displayDomain) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(isA6 ? 7 : 9);
          pdf.setTextColor(brand.r, brand.g, brand.b);
          pdf.text(displayDomain, width / 2, yPos, { align: "center" });
        }
      }

      // === BOTTOM ACCENT BAR ===
      pdf.setFillColor(brand.r, brand.g, brand.b);
      const bottomBarY = margin + cardH - barH - 4;
      drawRoundedRect(pdf, margin, bottomBarY, cardW, barH + 4, isA6 ? 6 : 8);
      pdf.rect(margin, bottomBarY, cardW, barH, "F");

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
          Generate a bold, branded sticker with QR code for your car window
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

        {/* Live Preview */}
        <div
          className="mx-auto rounded-xl border-2 overflow-hidden shadow-lg"
          style={{
            width: stickerSize === "a6" ? 210 : 250,
            aspectRatio: stickerSize === "a6" ? "105/148" : "148/210",
            backgroundColor: brandColour || "#1877F2",
            padding: 8,
          }}
        >
          <div className="bg-white rounded-lg h-full flex flex-col items-center justify-center text-center px-3 py-2 relative overflow-hidden">
            {/* Top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-2"
              style={{ backgroundColor: brandColour || "#1877F2" }}
            />
            {/* Bottom bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-2"
              style={{ backgroundColor: brandColour || "#1877F2" }}
            />

            <div className="flex-1 flex flex-col items-center justify-center gap-1 py-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
              )}
              <p
                className="font-bold text-sm leading-tight"
                style={{ color: brandColour || "#1877F2" }}
              >
                {instructorName}
              </p>
              <p className="text-[8px] font-semibold text-muted-foreground tracking-widest uppercase">
                Driving Instructor
              </p>
              <div
                className="rounded-full px-3 py-0.5 text-[7px] mt-0.5"
                style={{
                  backgroundColor: `${brandColour || "#1877F2"}15`,
                  color: brandColour || "#1877F2",
                }}
              >
                {tagline}
              </div>
              {instructorPhone && (
                <p
                  className="font-bold text-base mt-1"
                  style={{ color: brandColour || "#1877F2" }}
                >
                  {instructorPhone}
                </p>
              )}
              <div className="w-10 h-10 border border-muted rounded mt-1 flex items-center justify-center">
                <span className="text-[6px] text-muted-foreground">QR</span>
              </div>
              <p className="text-[6px] font-semibold text-muted-foreground uppercase tracking-wide">
                Scan to book
              </p>
              {displayDomain && (
                <p className="text-[6px]" style={{ color: brandColour || "#1877F2" }}>
                  {displayDomain}
                </p>
              )}
            </div>
          </div>
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
