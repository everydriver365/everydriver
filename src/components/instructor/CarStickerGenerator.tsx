import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, Car } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import stickerLPlate from "@/assets/sticker-l-plate.png";
import stickerCar from "@/assets/sticker-car.png";
import stickerStars from "@/assets/sticker-stars.png";
import stickerBadge from "@/assets/sticker-badge.png";

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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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

      // === WHITE INNER CARD ===
      const margin = isA6 ? 5 : 7;
      const cardW = width - margin * 2;
      const cardH = height - margin * 2;
      pdf.setFillColor(255, 255, 255);
      drawRoundedRect(pdf, margin, margin, cardW, cardH, isA6 ? 5 : 7);

      // === TOP ACCENT BAR ===
      const barH = isA6 ? 4 : 5;
      pdf.setFillColor(brand.r, brand.g, brand.b);
      drawRoundedRect(pdf, margin, margin, cardW, barH + 3, isA6 ? 5 : 7);
      pdf.rect(margin, margin + 3, cardW, barH, "F");

      // === L-PLATES in top corners ===
      const lPlateSize = isA6 ? 8 : 11;
      try {
        const lPlateImg = await loadImage(stickerLPlate);
        pdf.addImage(lPlateImg, "PNG", margin + 3, margin + barH + 2, lPlateSize, lPlateSize);
        pdf.addImage(lPlateImg, "PNG", width - margin - lPlateSize - 3, margin + barH + 2, lPlateSize, lPlateSize);
      } catch { /* skip */ }

      let yPos = margin + barH + lPlateSize + (isA6 ? 5 : 7);

      // === LOGO ===
      if (logoUrl) {
        try {
          const img = await loadImage(logoUrl);
          const logoSize = isA6 ? 18 : 25;
          pdf.addImage(img, "PNG", (width - logoSize) / 2, yPos, logoSize, logoSize);
          yPos += logoSize + (isA6 ? 3 : 5);
        } catch {
          yPos += 2;
        }
      }

      // === INSTRUCTOR NAME ===
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(isA6 ? 16 : 22);
      pdf.setTextColor(brand.r, brand.g, brand.b);
      const nameLines = pdf.splitTextToSize(instructorName, cardW - 16);
      pdf.text(nameLines, width / 2, yPos, { align: "center" });
      yPos += nameLines.length * (isA6 ? 6 : 8) + (isA6 ? 1 : 2);

      // === STARS ===
      const starsW = isA6 ? 28 : 38;
      const starsH = isA6 ? 6 : 8;
      try {
        const starsImg = await loadImage(stickerStars);
        pdf.addImage(starsImg, "PNG", (width - starsW) / 2, yPos, starsW, starsH);
        yPos += starsH + (isA6 ? 2 : 3);
      } catch {
        yPos += 2;
      }

      // === SUBTITLE ===
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(isA6 ? 8 : 10);
      pdf.setTextColor(80, 80, 80);
      pdf.text("DRIVING INSTRUCTOR", width / 2, yPos, { align: "center" });
      yPos += isA6 ? 5 : 7;

      // === CAR ILLUSTRATION ===
      const carW = isA6 ? 40 : 55;
      const carH = isA6 ? 16 : 22;
      try {
        const carImg = await loadImage(stickerCar);
        pdf.addImage(carImg, "PNG", (width - carW) / 2, yPos, carW, carH);
        yPos += carH + (isA6 ? 3 : 4);
      } catch {
        yPos += 4;
      }

      // === TAGLINE PILL ===
      const tagFontSize = isA6 ? 8 : 10;
      pdf.setFontSize(tagFontSize);
      const tagLines = pdf.splitTextToSize(tagline, cardW - 20);
      const pillH = tagLines.length * (tagFontSize * 0.4) + (isA6 ? 5 : 7);
      const pillW = cardW - (isA6 ? 14 : 18);
      pdf.setFillColor(lightBrand.r, lightBrand.g, lightBrand.b);
      drawRoundedRect(pdf, (width - pillW) / 2, yPos - 3, pillW, pillH, 2.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(brand.r, brand.g, brand.b);
      pdf.text(tagLines, width / 2, yPos + 0.5, { align: "center" });
      yPos += pillH + (isA6 ? 4 : 6);

      // === PHONE NUMBER ===
      if (instructorPhone) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(isA6 ? 16 : 22);
        pdf.setTextColor(brand.r, brand.g, brand.b);
        pdf.text(instructorPhone, width / 2, yPos, { align: "center" });
        yPos += isA6 ? 8 : 11;
      }

      // === QR CODE + BADGE side by side ===
      if (bookingUrl) {
        const qrSize = isA6 ? 24 : 34;
        const badgeSize = isA6 ? 16 : 22;
        const totalW = qrSize + badgeSize + (isA6 ? 6 : 8);
        const startX = (width - totalW) / 2;

        // QR Code
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=${brand.r.toString(16).padStart(2, '0')}${brand.g.toString(16).padStart(2, '0')}${brand.b.toString(16).padStart(2, '0')}&data=${encodeURIComponent(bookingUrl)}`;
        try {
          const qrImg = await loadImage(qrUrl);
          pdf.addImage(qrImg, "PNG", startX, yPos, qrSize, qrSize);
        } catch { /* skip */ }

        // Badge
        try {
          const badgeImg = await loadImage(stickerBadge);
          const badgeY = yPos + (qrSize - badgeSize) / 2;
          pdf.addImage(badgeImg, "PNG", startX + qrSize + (isA6 ? 6 : 8), badgeY, badgeSize, badgeSize);
        } catch { /* skip */ }

        yPos += qrSize + (isA6 ? 3 : 4);

        // === SCAN LABEL ===
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(isA6 ? 7 : 9);
        pdf.setTextColor(80, 80, 80);
        pdf.text("SCAN TO BOOK ONLINE", width / 2, yPos, { align: "center" });
        yPos += isA6 ? 3 : 4;

        // === DOMAIN ===
        if (displayDomain) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(isA6 ? 6.5 : 8);
          pdf.setTextColor(brand.r, brand.g, brand.b);
          pdf.text(displayDomain, width / 2, yPos, { align: "center" });
        }
      }

      // === BOTTOM ACCENT BAR ===
      pdf.setFillColor(brand.r, brand.g, brand.b);
      const bottomBarY = margin + cardH - barH - 3;
      drawRoundedRect(pdf, margin, bottomBarY, cardW, barH + 3, isA6 ? 5 : 7);
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
          className="mx-auto rounded-none border-2 overflow-hidden shadow-lg"
          style={{
            width: stickerSize === "a6" ? 210 : 250,
            aspectRatio: stickerSize === "a6" ? "105/148" : "148/210",
            backgroundColor: brandColour || "#1877F2",
            padding: 6,
          }}
        >
          <div className="bg-white rounded-none h-full flex flex-col items-center justify-center text-center px-2 py-1 relative overflow-hidden">
            {/* Top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: brandColour || "#1877F2" }}
            />
            {/* Bottom bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: brandColour || "#1877F2" }}
            />

            {/* L-plates in top corners */}
            <img src={stickerLPlate} alt="L" className="absolute top-2.5 left-2 h-5 w-5 object-contain" />
            <img src={stickerLPlate} alt="L" className="absolute top-2.5 right-2 h-5 w-5 object-contain" />

            <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-4">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
              )}
              <p
                className="font-bold text-xs leading-tight"
                style={{ color: brandColour || "#1877F2" }}
              >
                {instructorName}
              </p>

              {/* Stars */}
              <img src={stickerStars} alt="5 stars" className="h-3 w-auto object-contain" />

              <p className="text-[7px] font-semibold text-muted-foreground tracking-widest uppercase">
                Driving Instructor
              </p>

              {/* Car */}
              <img src={stickerCar} alt="Car" className="h-6 w-auto object-contain my-0.5" />

              <div
                className="rounded-full px-2 py-0.5 text-[6px]"
                style={{
                  backgroundColor: `${brandColour || "#1877F2"}15`,
                  color: brandColour || "#1877F2",
                }}
              >
                {tagline}
              </div>

              {instructorPhone && (
                <p
                  className="font-bold text-sm mt-0.5"
                  style={{ color: brandColour || "#1877F2" }}
                >
                  {instructorPhone}
                </p>
              )}

              {/* QR + Badge row */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-8 h-8 border border-muted rounded flex items-center justify-center">
                  <span className="text-[5px] text-muted-foreground">QR</span>
                </div>
                <img src={stickerBadge} alt="Approved" className="h-6 w-6 object-contain" />
              </div>

              <p className="text-[5px] font-semibold text-muted-foreground uppercase tracking-wide">
                Scan to book online
              </p>
              {displayDomain && (
                <p className="text-[5px]" style={{ color: brandColour || "#1877F2" }}>
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
