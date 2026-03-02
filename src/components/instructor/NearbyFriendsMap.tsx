import { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { NearbyFriend } from "@/hooks/useNearbyFriends";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";

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

      {/* Friend markers */}
      {friends.map((friend) => (
        <MarkerF
          key={friend.id}
          position={{ lat: friend.lat, lng: friend.lng }}
          onClick={() => setSelectedFriend(friend)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#34C759",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
          title={friend.name}
        />
      ))}

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
