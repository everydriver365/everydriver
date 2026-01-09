import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Star, User } from 'lucide-react';

interface HomepageTestimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar_initials: string | null;
  image_key: string | null;
  course_type: string | null;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
}

export function HomepageTestimonialsManager() {
  const [testimonials, setTestimonials] = useState<HomepageTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('homepage_testimonials')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const testimonial of testimonials) {
        const { error } = await supabase
          .from('homepage_testimonials')
          .update({
            name: testimonial.name,
            role: testimonial.role,
            content: testimonial.content,
            avatar_initials: testimonial.avatar_initials,
            image_key: testimonial.image_key,
            course_type: testimonial.course_type,
            is_featured: testimonial.is_featured,
            display_order: testimonial.display_order,
            is_active: testimonial.is_active,
          })
          .eq('id', testimonial.id);

        if (error) throw error;
      }
      toast.success('Testimonials saved successfully');
    } catch (error) {
      console.error('Error saving testimonials:', error);
      toast.error('Failed to save testimonials');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    try {
      const newOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.display_order)) + 1 : 1;
      const { data, error } = await supabase
        .from('homepage_testimonials')
        .insert({
          name: 'New Person',
          role: 'Student',
          content: 'Great experience!',
          avatar_initials: 'NP',
          display_order: newOrder,
          is_active: true,
          is_featured: false,
        })
        .select()
        .single();

      if (error) throw error;
      setTestimonials([...testimonials, data]);
      toast.success('Testimonial added');
    } catch (error) {
      console.error('Error adding testimonial:', error);
      toast.error('Failed to add testimonial');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('homepage_testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTestimonials(testimonials.filter(t => t.id !== id));
      toast.success('Testimonial deleted');
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Failed to delete testimonial');
    }
  };

  const updateTestimonial = (id: string, updates: Partial<HomepageTestimonial>) => {
    setTestimonials(testimonials.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const featuredTestimonials = testimonials.filter(t => t.is_featured);
  const regularTestimonials = testimonials.filter(t => !t.is_featured);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage testimonials. Featured ones appear in the hero polaroid collage.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Featured Testimonials (Polaroid Collage) */}
      {featuredTestimonials.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Featured (Hero Polaroids)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                onUpdate={updateTestimonial}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Testimonials */}
      {regularTestimonials.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <User className="h-5 w-5" />
            Regular Testimonials
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {regularTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                onUpdate={updateTestimonial}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {testimonials.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No testimonials configured. Click "Add Testimonial" to create one.
        </div>
      )}
    </div>
  );
}

function TestimonialCard({
  testimonial,
  onUpdate,
  onDelete,
}: {
  testimonial: HomepageTestimonial;
  onUpdate: (id: string, updates: Partial<HomepageTestimonial>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className={!testimonial.is_active ? 'opacity-50' : ''}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              {testimonial.avatar_initials || testimonial.name.charAt(0)}
            </div>
            <div>
              <Input
                value={testimonial.name}
                onChange={(e) => onUpdate(testimonial.id, { name: e.target.value })}
                className="h-8 font-semibold"
                placeholder="Name"
              />
            </div>
          </div>
          {testimonial.is_featured && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Role/Title</Label>
            <Input
              value={testimonial.role}
              onChange={(e) => onUpdate(testimonial.id, { role: e.target.value })}
              placeholder="Passed First Time"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Initials</Label>
            <Input
              value={testimonial.avatar_initials || ''}
              onChange={(e) => onUpdate(testimonial.id, { avatar_initials: e.target.value })}
              placeholder="ET"
              maxLength={3}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Content/Quote</Label>
          <Textarea
            value={testimonial.content}
            onChange={(e) => onUpdate(testimonial.id, { content: e.target.value })}
            placeholder="Great experience learning to drive!"
            rows={2}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Image Key (for CMS)</Label>
            <Input
              value={testimonial.image_key || ''}
              onChange={(e) => onUpdate(testimonial.id, { image_key: e.target.value })}
              placeholder="testimonial_sarah"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Course Type</Label>
            <Input
              value={testimonial.course_type || ''}
              onChange={(e) => onUpdate(testimonial.id, { course_type: e.target.value })}
              placeholder="Intensive"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={testimonial.is_active}
                onCheckedChange={(checked) => onUpdate(testimonial.id, { is_active: checked })}
              />
              <Label className="text-xs">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={testimonial.is_featured}
                onCheckedChange={(checked) => onUpdate(testimonial.id, { is_featured: checked })}
              />
              <Label className="text-xs">Featured</Label>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(testimonial.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
