import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { ContentBlock } from "@/hooks/useInstructorWebsitePages";

interface PageContentRendererProps {
  blocks: ContentBlock[];
  primaryColor: string;
  secondaryColor: string;
}

export function PageContentRenderer({
  blocks,
  primaryColor,
  secondaryColor,
}: PageContentRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "text":
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  {block.title && (
                    <h3
                      className="text-xl font-semibold mb-3"
                      style={{ color: primaryColor }}
                    >
                      {block.title}
                    </h3>
                  )}
                  {block.content && (
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {block.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            );

          case "features":
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  {block.title && (
                    <h3
                      className="text-xl font-semibold mb-4"
                      style={{ color: primaryColor }}
                    >
                      {block.title}
                    </h3>
                  )}
                  {block.items && block.items.length > 0 && (
                    <ul className="space-y-3">
                      {block.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2
                            className="h-5 w-5 mt-0.5 flex-shrink-0"
                            style={{ color: secondaryColor }}
                          />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );

          case "image":
            return block.image_url ? (
              <Card key={index} className="overflow-hidden">
                <img
                  src={block.image_url}
                  alt={block.title || "Image"}
                  className="w-full h-64 object-cover"
                />
                {block.title && (
                  <CardContent className="p-4">
                    <p className="text-center text-gray-600 text-sm">
                      {block.title}
                    </p>
                  </CardContent>
                )}
              </Card>
            ) : null;

          case "gallery":
            return block.images && block.images.length > 0 ? (
              <div key={index}>
                {block.title && (
                  <h3
                    className="text-xl font-semibold mb-4"
                    style={{ color: primaryColor }}
                  >
                    {block.title}
                  </h3>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {block.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Gallery image ${i + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            ) : null;

          default:
            return null;
        }
      })}
    </div>
  );
}
