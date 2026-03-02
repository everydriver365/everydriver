import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useNearbyFriends, NearbyFriend } from "@/hooks/useNearbyFriends";
import { NearbyFriendsMap } from "@/components/instructor/NearbyFriendsMap";
import { FriendRequestSheet } from "@/components/instructor/FriendRequestSheet";
import { InstructorDirectChat } from "@/components/instructor/InstructorDirectChat";

export default function InstructorNearbyFriends() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const { data, isLoading } = useNearbyFriends(instructorId);
  const [friendSheetOpen, setFriendSheetOpen] = useState(false);
  const [chatFriend, setChatFriend] = useState<NearbyFriend | null>(null);

  if (chatFriend && instructorId) {
    return (
      <InstructorDirectChat
        instructorId={instructorId}
        friendId={chatFriend.id}
        friendName={chatFriend.name}
        friendAvatar={chatFriend.profileImageUrl}
        onBack={() => setChatFriend(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Nearby ADIs</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFriendSheetOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Friends
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <NearbyFriendsMap
          myPosition={data?.myPosition || null}
          friends={data?.friends || []}
          onMessageFriend={setChatFriend}
          isLoading={isLoading}
        />

        {/* Friend count badge */}
        {(data?.friends?.length || 0) > 0 && (
          <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-border">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-foreground">
                {data!.friends.length} nearby
              </span>
            </div>
          </div>
        )}

        {!isLoading && (data?.friends?.length || 0) === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-border pointer-events-auto max-w-xs">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground mb-1">No friends nearby</p>
              <p className="text-sm text-muted-foreground mb-3">
                Add instructor friends to see them on the map when they're driving nearby.
              </p>
              <Button size="sm" onClick={() => setFriendSheetOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Add Friends
              </Button>
            </div>
          </div>
        )}
      </div>

      {instructorId && (
        <FriendRequestSheet
          open={friendSheetOpen}
          onOpenChange={setFriendSheetOpen}
          instructorId={instructorId}
        />
      )}
    </div>
  );
}
