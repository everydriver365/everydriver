import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorFriend {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  friendInstructor?: { id: string; name: string; profile_image_url: string | null };
}

export function useInstructorFriends(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: ["instructor-friends", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_friends")
        .select("*")
        .or(`requester_id.eq.${instructorId},recipient_id.eq.${instructorId}`);
      if (error) throw error;

      // Fetch friend instructor details
      const friendIds = (data || []).map((f: any) =>
        f.requester_id === instructorId ? f.recipient_id : f.requester_id
      );
      if (friendIds.length === 0) return [];

      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name, profile_image_url")
        .in("id", friendIds);

      const instMap = new Map((instructors || []).map((i: any) => [i.id, i]));

      return (data || []).map((f: any) => {
        const friendId = f.requester_id === instructorId ? f.recipient_id : f.requester_id;
        return { ...f, friendInstructor: instMap.get(friendId) || null } as InstructorFriend;
      });
    },
  });

  const sendRequest = useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase.from("instructor_friends").insert({
        requester_id: instructorId!,
        recipient_id: recipientId,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["instructor-friends"] }),
  });

  const respondToRequest = useMutation({
    mutationFn: async ({ friendshipId, status }: { friendshipId: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase
        .from("instructor_friends")
        .update({ status })
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["instructor-friends"] }),
  });

  const removeFriend = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from("instructor_friends").delete().eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["instructor-friends"] }),
  });

  const searchInstructors = async (query: string) => {
    const { data } = await supabase
      .from("instructors")
      .select("id, name, profile_image_url")
      .neq("id", instructorId!)
      .ilike("name", `%${query}%`)
      .limit(10);
    return data || [];
  };

  const acceptedFriends = (friendsQuery.data || []).filter((f) => f.status === "accepted");
  const pendingReceived = (friendsQuery.data || []).filter(
    (f) => f.status === "pending" && f.recipient_id === instructorId
  );
  const pendingSent = (friendsQuery.data || []).filter(
    (f) => f.status === "pending" && f.requester_id === instructorId
  );

  return {
    friends: friendsQuery.data || [],
    acceptedFriends,
    pendingReceived,
    pendingSent,
    isLoading: friendsQuery.isLoading,
    sendRequest,
    respondToRequest,
    removeFriend,
    searchInstructors,
  };
}
