import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Note {
  id: string;
  owner_type: string;
  owner_id: string;
  shared_with_id: string | null;
  title: string;
  content: string;
  is_pinned: boolean;
  folder: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseNotesOptions {
  ownerType: string;
  ownerId: string | undefined;
  folders: string[];
}

export function useNotes({ ownerType, ownerId, folders }: UseNotesOptions) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState("All");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("owner_type", ownerType)
        .eq("owner_id", ownerId)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes((data as Note[]) || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  }, [ownerType, ownerId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = notes.filter((n) => {
    if (n.deleted_at) {
      return activeFolder === "Recently Deleted";
    }
    if (activeFolder === "Recently Deleted") return false;
    if (activeFolder !== "All" && n.folder !== activeFolder) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  const createNote = async () => {
    if (!ownerId) return;
    const folder = activeFolder === "All" || activeFolder === "Recently Deleted" ? "General" : activeFolder;
    const { data, error } = await supabase
      .from("notes")
      .insert({
        owner_type: ownerType,
        owner_id: ownerId,
        title: "Untitled",
        content: "",
        folder,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create note");
      return;
    }
    const newNote = data as Note;
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const { error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to save");
      return;
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n))
    );
    if (selectedNote?.id === id) {
      setSelectedNote((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  };

  const debouncedUpdate = useCallback(
    (id: string, updates: Partial<Note>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => updateNote(id, updates), 1000);
    },
    []
  );

  const deleteNote = async (id: string) => {
    await updateNote(id, { deleted_at: new Date().toISOString() });
    if (selectedNote?.id === id) setSelectedNote(null);
    toast.success("Note moved to Recently Deleted");
  };

  const restoreNote = async (id: string) => {
    const { error } = await supabase
      .from("notes")
      .update({ deleted_at: null })
      .eq("id", id);
    if (error) {
      toast.error("Failed to restore");
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deleted_at: null } : n)));
    toast.success("Note restored");
  };

  const permanentlyDelete = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    toast.success("Note permanently deleted");
  };

  const togglePin = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) await updateNote(id, { is_pinned: !note.is_pinned });
  };

  return {
    notes: filteredNotes,
    allNotes: notes,
    loading,
    selectedNote,
    setSelectedNote,
    searchQuery,
    setSearchQuery,
    activeFolder,
    setActiveFolder,
    createNote,
    updateNote,
    debouncedUpdate,
    deleteNote,
    restoreNote,
    permanentlyDelete,
    togglePin,
    folders,
  };
}
