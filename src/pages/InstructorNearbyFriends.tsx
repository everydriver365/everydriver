import { useState } from "react";
import { Users, UserPlus, Map, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useNearbyFriends, NearbyFriend } from "@/hooks/useNearbyFriends";
import { NearbyFriendsMap } from "@/components/instructor/NearbyFriendsMap";
import { FriendRequestSheet } from "@/components/instructor/FriendRequestSheet";
import { InstructorDirectChat } from "@/components/instructor/InstructorDirectChat";
import { InstructorDirectory } from "@/components/instructor/InstructorDirectory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { cn } from "@/lib/utils";

type Tab = "map" | "directory";

export default function InstructorNearbyFriends() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const { data, isLoading } = useNearbyFriends(instructorId);
  const [friendSheetOpen, setFriendSheetOpen] = useState(false);
  const [chatFriend, setChatFriend] = useState<NearbyFriend | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("map");

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
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Nearby ADIs
          </h1>
          <Button variant="outline" size="sm" onClick={() => setFriendSheetOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Friends
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("map")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "map"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Map className="h-4 w-4" /> Live Map
          </button>
          <button
            onClick={() => setActiveTab("directory")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "directory"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Search className="h-4 w-4" /> Find ADIs
          </button>
        </div>

        {/* Content */}
        {activeTab === "map" ? (
          <div className="relative h-[60vh] rounded-xl overflow-hidden border border-border">
            <NearbyFriendsMap
              myPosition={data?.myPosition || null}
              friends={data?.friends || []}
              onMessageFriend={setChatFriend}
              isLoading={isLoading}
            />

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
                  <Button size="sm" onClick={() => setActiveTab("directory")}>
                    <Search className="h-4 w-4 mr-1" /> Find ADIs
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {instructorId && <InstructorDirectory instructorId={instructorId} />}
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
    </InstructorPortalLayout>
  );
}
