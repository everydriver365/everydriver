import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract receipt details from this image. Return JSON only with these fields:
- amount: number (total amount in GBP, just the number)
- date: string (YYYY-MM-DD format, or null if not visible)
- category: string (one of: Fuel, Vehicle Maintenance, Insurance, Training Materials, Office Supplies, Marketing, Tolls & Parking, Other)
- vendor: string (store/company name, or null if not visible)

Return ONLY valid JSON, no markdown or other text.`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt_data",
              description: "Extract structured data from a receipt image",
              parameters: {
                type: "object",
                properties: {
                  amount: { type: "number", description: "Total amount in GBP" },
                  date: { type: "string", description: "Date in YYYY-MM-DD format, or null" },
                  category: {
                    type: "string",
                    enum: ["Fuel", "Vehicle Maintenance", "Insurance", "Training Materials", "Office Supplies", "Marketing", "Tolls & Parking", "Other"],
                  },
                  vendor: { type: "string", description: "Store or company name" },
                },
                required: ["amount", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let extracted = { amount: null, date: null, category: "Other", vendor: null };
    
    if (toolCall?.function?.arguments) {
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        // Try parsing from content
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            extracted = JSON.parse(content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
          } catch { /* use defaults */ }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
