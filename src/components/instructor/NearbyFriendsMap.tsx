import { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { NearbyFriend } from "@/hooks/useNearbyFriends";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Coffee, Car } from "lucide-react";
import { format } from "date-fns";

interface NearbyFriendsMapProps {
  myPosition: { lat: number; lng: number } | null;
  friends: NearbyFriend[];
  onMessageFriend: (friend: NearbyFriend) => void;
  isLoading: boolean;
}

const mapContainerStyle = { width: "100%", height: "100%" };

export function NearbyFriendsMap({ myPosition, friends, onMessageFriend, isLoading }: NearbyFriendsMapProps) {
  const [selectedFriend, setSelectedFriend] = useState<NearbyFriend | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const center = myPosition || { lat: 53.5, lng: -1.5 };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={12}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      {/* My position marker */}
      {myPosition && (
        <MarkerF
          position={myPosition}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#0075c9",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          }}
          title="You"
        />
      )}

      {/* Friend markers — green if free, amber if teaching */}
      {friends.map((friend) => {
        const isBusy = !!friend.currentLesson;
        return (
          <MarkerF
            key={friend.id}
            position={{ lat: friend.lat, lng: friend.lng }}
            onClick={() => setSelectedFriend(friend)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: isBusy ? "#FF9500" : "#34C759",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            title={`${friend.name}${isBusy ? ` — ${friend.currentLesson!.lessonType}` : " — Free"}`}
          />
        );
      })}

      {/* Info window */}
      {selectedFriend && (
        <InfoWindowF
          position={{ lat: selectedFriend.lat, lng: selectedFriend.lng }}
          onCloseClick={() => setSelectedFriend(null)}
        >
          <div className="p-1 min-w-[160px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                {selectedFriend.profileImageUrl ? (
                  <img src={selectedFriend.profileImageUrl} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-emerald-700">
                    {selectedFriend.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{selectedFriend.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedFriend.distanceKm < 1
                    ? `${Math.round(selectedFriend.distanceKm * 1000)}m away`
                    : `${selectedFriend.distanceKm.toFixed(1)}km away`}
                </p>
              </div>
            </div>

            {/* Lesson status */}
            {selectedFriend.currentLesson ? (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-none" style={{ backgroundColor: "#FFF3E0" }}>
                <Car className="h-3.5 w-3.5" style={{ color: "#FF9500" }} />
                <div>
                  <p className="text-xs font-semibold text-gray-800">
                    {selectedFriend.currentLesson.lessonType}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Finishes at {format(new Date(selectedFriend.currentLesson.endsAt), "HH:mm")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-none" style={{ backgroundColor: "#E8F5E9" }}>
                <Coffee className="h-3.5 w-3.5" style={{ color: "#34C759" }} />
                <p className="text-xs font-semibold" style={{ color: "#2E7D32" }}>
                  Free — available for a break ☕
                </p>
              </div>
            )}

            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                onMessageFriend(selectedFriend);
                setSelectedFriend(null);
              }}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Message
            </Button>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
