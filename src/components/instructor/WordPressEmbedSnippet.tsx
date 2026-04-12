import { useState } from "react";
import { Copy, Check, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface WordPressEmbedSnippetProps {
  slug: string;
  brandColour?: string | null;
}

export function WordPressEmbedSnippet({ slug, brandColour }: WordPressEmbedSnippetProps) {
  const [copied, setCopied] = useState(false);
  const btnColor = brandColour || "#1e3a5f";

  const snippet = `<div id="everydriver-courses"></div>
<script>
(function(){
  var slug = "${slug}";
  var btnColor = "${btnColor}";
  var el = document.getElementById("everydriver-courses");
  el.innerHTML = '<p style="text-align:center;padding:40px;color:#666;">Loading courses...</p>';

  window.openBooking = function(url) {
    var overlay = document.createElement("div");
    overlay.id = "ed-booking-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;";
    var wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;width:95%;max-width:600px;height:90vh;";
    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = "position:absolute;top:-12px;right:-12px;width:36px;height:36px;border-radius:50%;background:#fff;border:none;font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:1;display:flex;align-items:center;justify-content:center;line-height:1;";
    closeBtn.onclick = function(){ document.body.removeChild(overlay); };
    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.cssText = "width:100%;height:100%;border:none;border-radius:12px;background:#fff;";
    wrap.appendChild(closeBtn);
    wrap.appendChild(iframe);
    overlay.appendChild(wrap);
    overlay.onclick = function(e){ if(e.target === overlay) document.body.removeChild(overlay); };
    document.body.appendChild(overlay);
  }

  fetch("https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/public-courses?slug=" + slug)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data.courses || data.courses.length === 0){
        el.innerHTML = '<p style="text-align:center;padding:40px;color:#666;">No courses available at this time.</p>';
        return;
      }
      var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">';
      data.courses.forEach(function(c){
        var price = c.discountedPrice || c.price;
        html += '<div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow=\\'0 8px 24px rgba(0,0,0,0.12)\\'" onmouseout="this.style.boxShadow=\\'0 2px 8px rgba(0,0,0,0.06)\\'">';
        if(c.courseImageUrl){
          html += '<div style="width:100%;height:180px;overflow:hidden;background:#f3f4f6;">';
          html += '<img src="' + c.courseImageUrl + '" alt="' + c.name + '" style="width:100%;height:100%;object-fit:cover;" />';
          html += '</div>';
        }
        html += '<div style="padding:20px;">';
        if(c.isPopular) html += '<span style="display:inline-block;background:' + btnColor + ';color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px;margin-bottom:10px;letter-spacing:0.5px;text-transform:uppercase;">Popular</span>';
        html += '<h3 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111;">' + c.name + '</h3>';
        html += '<p style="margin:0 0 12px;color:#666;font-size:14px;">' + c.hours + ' hours of instruction</p>';
        if(c.features && c.features.length > 0){
          html += '<ul style="margin:0 0 14px;padding:0;list-style:none;">';
          c.features.slice(0,4).forEach(function(f){
            html += '<li style="font-size:13px;color:#555;padding:2px 0;"><span style="color:' + btnColor + ';margin-right:6px;">&#10003;</span>' + f + '</li>';
          });
          html += '</ul>';
        }
        if(price){
          html += '<div style="margin-bottom:14px;">';
          html += '<span style="font-size:26px;font-weight:800;color:#111;">&pound;' + price + '</span>';
          if(c.discountedPrice && c.price) html += ' <span style="font-size:14px;color:#999;text-decoration:line-through;">&pound;' + c.price + '</span>';
          html += '</div>';
        }
        if(c.nextAvailable) html += '<p style="margin:0 0 16px;font-size:13px;color:#666;">Next available: ' + c.nextAvailable + '</p>';
        html += '<button onclick="openBooking(\\'' + c.bookingUrl + '\\')" style="display:block;width:100%;background:' + btnColor + ';color:#fff;padding:12px 20px;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity 0.2s;" onmouseover="this.style.opacity=\\'0.9\\'" onmouseout="this.style.opacity=\\'1\\'">Book Now</button>';
        html += '</div></div>';
      });
      html += '</div>';
      el.innerHTML = html;
    })
    .catch(function(){
      el.innerHTML = '<p style="text-align:center;padding:40px;color:#c00;">Unable to load courses. Please try again later.</p>';
    });
})();
<` + `/script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Snippet copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Code className="h-5 w-5 text-primary" />
          WordPress Embed
        </CardTitle>
        <CardDescription>
          Paste this code into a WordPress "Custom HTML" block to show your courses on any page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <pre className="bg-muted rounded-2xl p-4 text-xs overflow-x-auto max-h-64 overflow-y-auto border">
            <code>{snippet}</code>
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 gap-1.5"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="rounded-2xl border p-3 bg-accent/30 text-sm text-muted-foreground space-y-1">
          <p><strong>How to use:</strong></p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>In your WordPress editor, add a <strong>Custom HTML</strong> block</li>
            <li>Paste the code above into the block</li>
            <li>Save/publish your page — your courses will appear automatically</li>
          </ol>
          <p className="mt-2 text-xs">Clicking "Book Now" opens the booking form in a popup overlay — your visitors never leave your site.</p>
        </div>
      </CardContent>
    </Card>
  );
}
