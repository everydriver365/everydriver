import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, base64Content, mimeType, fileName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categories = [
      "Fuel",
      "Vehicle Maintenance",
      "Insurance",
      "Training Materials",
      "Office Supplies",
      "Marketing",
      "Tolls & Parking",
      "Other",
    ];

    const systemPrompt = `You are an invoice/receipt data extraction assistant. Extract the following from the document:
- amount: The total amount (number only, no currency symbols)
- date: The invoice/receipt date in YYYY-MM-DD format
- description: The vendor/supplier name and a brief summary of what was purchased
- category: Best matching category from this list: ${categories.join(", ")}

You MUST use the extract_invoice_data tool to return your answer.`;

    const userContent: any[] = [];

    if (base64Content && mimeType) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64Content}` },
      });
      userContent.push({
        type: "text",
        text: `Extract invoice/receipt details from this document. File name: ${fileName || "unknown"}`,
      });
    } else if (fileUrl) {
      userContent.push({
        type: "image_url",
        image_url: { url: fileUrl },
      });
      userContent.push({
        type: "text",
        text: `Extract invoice/receipt details from this document.`,
      });
    } else {
      return new Response(
        JSON.stringify({ error: "No file content provided" }),
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_data",
              description: "Extract structured data from an invoice or receipt",
              parameters: {
                type: "object",
                properties: {
                  amount: { type: "number", description: "Total amount as a number" },
                  date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  description: { type: "string", description: "Vendor name and brief summary" },
                  category: {
                    type: "string",
                    enum: categories,
                    description: "Best matching expense category",
                  },
                },
                required: ["amount", "date", "description", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured data returned from AI");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-invoice-data error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract invoice data",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
