import { Phone, MessageSquare, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InstructorInfo {
  name: string;
  phone: string | null;
  email: string | null;
  profile_image_url: string | null;
  brand_colour: string | null;
}

interface PupilPortalContactProps {
  instructor: InstructorInfo;
}

export function PupilPortalContact({ instructor }: PupilPortalContactProps) {
  return (
    <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          {instructor.profile_image_url ? (
            <img 
              src={instructor.profile_image_url} 
              alt={instructor.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: instructor.brand_colour || '#1e3a5f' }}
            >
              {instructor.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-medium" style={{ color: 'var(--brand-text)' }}>
              {instructor.name}
            </div>
            <div className="text-sm" style={{ color: 'var(--brand-muted)' }}>
              Your Instructor
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {instructor.phone && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-col h-auto py-3"
              onClick={() => window.location.href = `tel:${instructor.phone}`}
              style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
            >
              <Phone className="h-5 w-5 mb-1" style={{ color: instructor.brand_colour || '#1e3a5f' }} />
              <span className="text-xs">Call</span>
            </Button>
          )}
          {instructor.phone && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-col h-auto py-3"
              onClick={() => window.location.href = `sms:${instructor.phone}`}
              style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
            >
              <MessageSquare className="h-5 w-5 mb-1" style={{ color: instructor.brand_colour || '#1e3a5f' }} />
              <span className="text-xs">Text</span>
            </Button>
          )}
          {instructor.email && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-col h-auto py-3"
              onClick={() => window.location.href = `mailto:${instructor.email}`}
              style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
            >
              <Mail className="h-5 w-5 mb-1" style={{ color: instructor.brand_colour || '#1e3a5f' }} />
              <span className="text-xs">Email</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
