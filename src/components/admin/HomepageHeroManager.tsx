import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Type, Search, Star, Users } from 'lucide-react';

interface HomepageHero {
  id: string;
  badge_text: string;
  headline_line1: string;
  headline_line2: string;
  headline_highlight: string;
  headline_line3: string;
  subtext: string;
  search_placeholder: string;
  search_button_text: string;
  rating_value: string;
  learners_count: string;
  learners_label: string;
}

export function HomepageHeroManager() {
  const [hero, setHero] = useState<HomepageHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchHero = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('homepage_hero')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setHero(data || null);
    } catch (error) {
      console.error('Error fetching hero:', error);
      toast.error('Failed to load hero content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHero();
  }, []);

  const handleSave = async () => {
    if (!hero) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_hero')
        .update({
          badge_text: hero.badge_text,
          headline_line1: hero.headline_line1,
          headline_line2: hero.headline_line2,
          headline_highlight: hero.headline_highlight,
          headline_line3: hero.headline_line3,
          subtext: hero.subtext,
          search_placeholder: hero.search_placeholder,
          search_button_text: hero.search_button_text,
          rating_value: hero.rating_value,
          learners_count: hero.learners_count,
          learners_label: hero.learners_label,
        })
        .eq('id', hero.id);

      if (error) throw error;
      toast.success('Hero content saved successfully');
    } catch (error) {
      console.error('Error saving hero:', error);
      toast.error('Failed to save hero content');
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (updates: Partial<HomepageHero>) => {
    if (hero) {
      setHero({ ...hero, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hero) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hero content found. Please check the database.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Edit the main hero section text, badge, and search form content
        </p>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Headlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Type className="h-4 w-4" />
              Headlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Badge Text</Label>
              <Input
                value={hero.badge_text}
                onChange={(e) => updateHero({ badge_text: e.target.value })}
                placeholder="Free Re-test"
              />
              <p className="text-xs text-muted-foreground">Shown in green badge above headline</p>
            </div>
            
            <div className="space-y-2">
              <Label>Headline Line 1</Label>
              <Input
                value={hero.headline_line1}
                onChange={(e) => updateHero({ headline_line1: e.target.value })}
                placeholder="Your Driving"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Line 2 (before highlight)</Label>
                <Input
                  value={hero.headline_line2}
                  onChange={(e) => updateHero({ headline_line2: e.target.value })}
                  placeholder="Success"
                />
              </div>
              <div className="space-y-2">
                <Label>Highlight Word (green)</Label>
                <Input
                  value={hero.headline_highlight}
                  onChange={(e) => updateHero({ headline_highlight: e.target.value })}
                  placeholder="Story"
                  className="border-emerald-300 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Headline Line 3</Label>
              <Input
                value={hero.headline_line3}
                onChange={(e) => updateHero({ headline_line3: e.target.value })}
                placeholder="Starts Here"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtext</Label>
              <Textarea
                value={hero.subtext}
                onChange={(e) => updateHero({ subtext: e.target.value })}
                placeholder="Join thousands who passed..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search & Social Proof */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4" />
                Search Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Placeholder Text</Label>
                <Input
                  value={hero.search_placeholder}
                  onChange={(e) => updateHero({ search_placeholder: e.target.value })}
                  placeholder="Enter your postcode..."
                />
              </div>
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={hero.search_button_text}
                  onChange={(e) => updateHero({ search_button_text: e.target.value })}
                  placeholder="Find Courses"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4 text-amber-500" />
                Social Proof
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rating Value</Label>
                <Input
                  value={hero.rating_value}
                  onChange={(e) => updateHero({ rating_value: e.target.value })}
                  placeholder="4.9"
                />
                <p className="text-xs text-muted-foreground">Shown next to 5 stars</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Learners Count</Label>
                  <Input
                    value={hero.learners_count}
                    onChange={(e) => updateHero({ learners_count: e.target.value })}
                    placeholder="10k+"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Learners Label</Label>
                  <Input
                    value={hero.learners_label}
                    onChange={(e) => updateHero({ learners_label: e.target.value })}
                    placeholder="Learners"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Shown in the floating badge on polaroid collage</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-4">
              {hero.badge_text}
            </span>
            <h1 className="text-3xl font-bold tracking-tight leading-[1.1]">
              <span className="text-primary">{hero.headline_line1}</span>
              <br />
              <span className="text-primary">{hero.headline_line2} </span>
              <span className="text-emerald-500">{hero.headline_highlight}</span>
              <br />
              <span className="text-primary">{hero.headline_line3}</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              {hero.subtext}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
