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
  var el = document.getElementById("everydriver-courses");
  el.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">Loading courses...</p>';
  fetch("https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/public-courses?slug=" + slug)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data.courses || data.courses.length === 0){
        el.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">No courses available at this time.</p>';
        return;
      }
      var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">';
      data.courses.forEach(function(c){
        var price = c.discountedPrice || c.price;
        html += '<div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.08);">';
        if(c.isPopular) html += '<span style="display:inline-block;background:${btnColor};color:#fff;font-size:11px;padding:2px 8px;border-radius:99px;margin-bottom:8px;">Popular</span>';
        html += '<h3 style="margin:0 0 4px;font-size:18px;font-weight:600;">' + c.name + '</h3>';
        html += '<p style="margin:0 0 8px;color:#666;font-size:14px;">' + c.hours + ' hours of instruction</p>';
        if(price) html += '<p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111;">&pound;' + price + '</p>';
        if(c.discountedPrice && c.price) html += '<p style="margin:0 0 8px;font-size:13px;color:#999;text-decoration:line-through;">&pound;' + c.price + '</p>';
        if(c.nextAvailable) html += '<p style="margin:0 0 12px;font-size:13px;color:#666;">Next available: ' + c.nextAvailable + '</p>';
        html += '<a href="' + c.bookingUrl + '" target="_blank" rel="noopener" '
              + 'style="display:inline-block;background:${btnColor};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">'
              + 'Book Now</a>';
        html += '</div>';
      });
      html += '</div>';
      el.innerHTML = html;
    })
    .catch(function(){
      el.innerHTML = '<p style="text-align:center;padding:20px;color:#c00;">Unable to load courses. Please try again later.</p>';
    });
})();
</script>`;

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
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-64 overflow-y-auto border">
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
        <div className="rounded-lg border p-3 bg-accent/30 text-sm text-muted-foreground space-y-1">
          <p><strong>How to use:</strong></p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>In your WordPress editor, add a <strong>Custom HTML</strong> block</li>
            <li>Paste the code above into the block</li>
            <li>Save/publish your page — your courses will appear automatically</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
