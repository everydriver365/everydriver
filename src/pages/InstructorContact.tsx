import { useState, useEffect } from "react";
import { Phone, Mail, MessageCircle, User, MapPin } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { supabase } from "@/integrations/supabase/client";

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface Pupil {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  postcode: string;
}

export default function InstructorContact() {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPupils();
  }, []);

  const fetchPupils = async () => {
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, phone, email, postcode")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .order("name");

      if (error) throw error;
      setPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <MainLayout>
      <div className="container py-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Contact Pupils
          </h1>
        </div>

        {/* Quick Actions */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">School Support</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                <a href="tel:+441onal234567">
                  <Phone className="h-4 w-4" />
                  Call Office
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                <a href="mailto:support@drivingschool.com">
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pupils List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Pupils ({pupils.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : pupils.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pupils assigned yet
              </p>
            ) : (
              <div className="space-y-3">
                {pupils.map((pupil) => (
                  <div
                    key={pupil.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(pupil.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{pupil.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pupil.postcode}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {pupil.phone && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`tel:${pupil.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`sms:${pupil.phone}`}>
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </Button>
                        </>
                      )}
                      {pupil.email && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`mailto:${pupil.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <InstructorBottomNav />
    </MainLayout>
  );
}
