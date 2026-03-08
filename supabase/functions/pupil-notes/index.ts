import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, pupil_id, note_id, title, content, is_pinned } = await req.json();

    if (!pupil_id) {
      return new Response(JSON.stringify({ error: "pupil_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const headers = { ...corsHeaders, "Content-Type": "application/json" };

    if (action === "list") {
      // Get pupil's own notes
      const { data: own, error: ownErr } = await supabase
        .from("notes")
        .select("*")
        .eq("owner_type", "pupil")
        .eq("owner_id", pupil_id)
        .is("deleted_at", null)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      // Get notes shared by instructor
      const { data: shared, error: sharedErr } = await supabase
        .from("notes")
        .select("*")
        .eq("owner_type", "instructor")
        .eq("shared_with_id", pupil_id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (ownErr || sharedErr) {
        return new Response(JSON.stringify({ error: "Failed to fetch notes" }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ own: own || [], shared: shared || [] }), { headers });

    } else if (action === "create") {
      const { data, error } = await supabase
        .from("notes")
        .insert({ owner_type: "pupil", owner_id: pupil_id, title: title || "Untitled", content: content || "" })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to create note" }), { status: 500, headers });
      }
      return new Response(JSON.stringify({ note: data }), { headers });

    } else if (action === "update") {
      if (!note_id) {
        return new Response(JSON.stringify({ error: "note_id is required" }), { status: 400, headers });
      }

      // Verify ownership
      const { data: existing } = await supabase
        .from("notes")
        .select("owner_type, owner_id")
        .eq("id", note_id)
        .single();

      if (!existing || existing.owner_type !== "pupil" || existing.owner_id !== pupil_id) {
        return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers });
      }

      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (is_pinned !== undefined) updates.is_pinned = is_pinned;

      const { error } = await supabase.from("notes").update(updates).eq("id", note_id);
      if (error) {
        return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500, headers });
      }
      return new Response(JSON.stringify({ success: true }), { headers });

    } else if (action === "delete") {
      if (!note_id) {
        return new Response(JSON.stringify({ error: "note_id is required" }), { status: 400, headers });
      }

      // Verify ownership
      const { data: existing } = await supabase
        .from("notes")
        .select("owner_type, owner_id")
        .eq("id", note_id)
        .single();

      if (!existing || existing.owner_type !== "pupil" || existing.owner_id !== pupil_id) {
        return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers });
      }

      await supabase.from("notes").update({ deleted_at: new Date().toISOString() }).eq("id", note_id);
      return new Response(JSON.stringify({ success: true }), { headers });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers });
    }
  } catch (error) {
    console.error("pupil-notes error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
