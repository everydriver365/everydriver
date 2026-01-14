import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Plus, Trash2, Star, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInstructorAppAdmin, InstructorAppHero, InstructorAppFeature, InstructorAppTestimonial, InstructorAppSection } from '@/hooks/useInstructorAppContent';

export function InstructorAppCMSManager() {
  const { hero, features, testimonials, sections, loading, updateHero, updateFeature, addFeature, deleteFeature, updateTestimonial, addTestimonial, deleteTestimonial, updateSection } = useInstructorAppAdmin();
  const [editedHero, setEditedHero] = useState<InstructorAppHero | null>(null);
  const [editedFeatures, setEditedFeatures] = useState<InstructorAppFeature[]>([]);
  const [editedTestimonials, setEditedTestimonials] = useState<InstructorAppTestimonial[]>([]);
  const [editedSections, setEditedSections] = useState<InstructorAppSection[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (hero) setEditedHero(hero);
    if (features.length) setEditedFeatures(features);
    if (testimonials.length) setEditedTestimonials(testimonials);
    if (sections.length) setEditedSections(sections);
  }, [hero, features, testimonials, sections]);

  const handleSaveHero = async () => {
    if (!editedHero) return;
    setSaving(true);
    const success = await updateHero(editedHero);
    toast({ title: success ? 'Hero Updated' : 'Error', description: success ? 'Hero content saved.' : 'Failed to save.', variant: success ? 'default' : 'destructive' });
    setSaving(false);
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    for (const feature of editedFeatures) {
      await updateFeature(feature.id, feature);
    }
    toast({ title: 'Features Updated', description: 'All features saved.' });
    setSaving(false);
  };

  const handleAddFeature = async () => {
    await addFeature({ icon_name: 'Star', title: 'New Feature', description: 'Feature description' });
    toast({ title: 'Feature Added' });
  };

  const handleDeleteFeature = async (id: string) => {
    await deleteFeature(id);
    toast({ title: 'Feature Deleted' });
  };

  const handleSaveTestimonials = async () => {
    setSaving(true);
    for (const testimonial of editedTestimonials) {
      await updateTestimonial(testimonial.id, testimonial);
    }
    toast({ title: 'Testimonials Updated', description: 'All testimonials saved.' });
    setSaving(false);
  };

  const handleAddTestimonial = async () => {
    await addTestimonial({ name: 'New Instructor', role: 'ADI, City', content: 'Great experience!', rating: 5, photo_url: null });
    toast({ title: 'Testimonial Added' });
  };

  const handleDeleteTestimonial = async (id: string) => {
    await deleteTestimonial(id);
    toast({ title: 'Testimonial Deleted' });
  };

  const handleSaveSections = async () => {
    setSaving(true);
    for (const section of editedSections) {
      await updateSection(section.id, section);
    }
    toast({ title: 'Sections Updated', description: 'All section titles saved.' });
    setSaving(false);
  };

  const handleToggleSectionVisibility = async (section: InstructorAppSection) => {
    await updateSection(section.id, { is_visible: !section.is_visible });
    toast({ title: section.is_visible ? 'Section Hidden' : 'Section Visible' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="hero" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        <TabsTrigger value="sections">Sections</TabsTrigger>
      </TabsList>

      {/* Hero Tab */}
      <TabsContent value="hero">
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>Edit the main hero content on the Instructor App landing page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedHero && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Badge Text</Label>
                    <Input value={editedHero.badge_text} onChange={(e) => setEditedHero({ ...editedHero, badge_text: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Headline Part 1</Label>
                    <Input value={editedHero.headline_part1} onChange={(e) => setEditedHero({ ...editedHero, headline_part1: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Headline Highlight (gradient text)</Label>
                    <Input value={editedHero.headline_highlight} onChange={(e) => setEditedHero({ ...editedHero, headline_highlight: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subtext</Label>
                  <Textarea value={editedHero.subtext} onChange={(e) => setEditedHero({ ...editedHero, subtext: e.target.value })} rows={3} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary CTA Text</Label>
                    <Input value={editedHero.primary_cta_text} onChange={(e) => setEditedHero({ ...editedHero, primary_cta_text: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary CTA Link</Label>
                    <Input value={editedHero.primary_cta_link} onChange={(e) => setEditedHero({ ...editedHero, primary_cta_link: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary CTA Text</Label>
                    <Input value={editedHero.secondary_cta_text} onChange={(e) => setEditedHero({ ...editedHero, secondary_cta_text: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary CTA Link</Label>
                    <Input value={editedHero.secondary_cta_link} onChange={(e) => setEditedHero({ ...editedHero, secondary_cta_link: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Demo CTA Text</Label>
                    <Input value={editedHero.demo_cta_text} onChange={(e) => setEditedHero({ ...editedHero, demo_cta_text: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Demo CTA Link</Label>
                    <Input value={editedHero.demo_cta_link} onChange={(e) => setEditedHero({ ...editedHero, demo_cta_link: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Trust Badge 1</Label>
                    <Input value={editedHero.trust_badge1} onChange={(e) => setEditedHero({ ...editedHero, trust_badge1: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Trust Badge 2</Label>
                    <Input value={editedHero.trust_badge2} onChange={(e) => setEditedHero({ ...editedHero, trust_badge2: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSaveHero} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Hero
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Features Tab */}
      <TabsContent value="features">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Features</CardTitle>
              <CardDescription>Manage the feature cards shown on the landing page</CardDescription>
            </div>
            <Button onClick={handleAddFeature} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Feature
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedFeatures.map((feature, index) => (
              <Card key={feature.id} className={!feature.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Feature {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Switch checked={feature.is_active} onCheckedChange={(checked) => setEditedFeatures(prev => prev.map(f => f.id === feature.id ? { ...f, is_active: checked } : f))} />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteFeature(feature.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Icon Name</Label>
                      <Input value={feature.icon_name} onChange={(e) => setEditedFeatures(prev => prev.map(f => f.id === feature.id ? { ...f, icon_name: e.target.value } : f))} placeholder="Calendar, Users, etc." />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Title</Label>
                      <Input value={feature.title} onChange={(e) => setEditedFeatures(prev => prev.map(f => f.id === feature.id ? { ...f, title: e.target.value } : f))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={feature.description} onChange={(e) => setEditedFeatures(prev => prev.map(f => f.id === feature.id ? { ...f, description: e.target.value } : f))} rows={2} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={handleSaveFeatures} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Features
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Testimonials Tab */}
      <TabsContent value="testimonials">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Testimonials</CardTitle>
              <CardDescription>Manage instructor testimonials for the marketing page</CardDescription>
            </div>
            <Button onClick={handleAddTestimonial} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Testimonial
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedTestimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} onClick={() => setEditedTestimonials(prev => prev.map(t => t.id === testimonial.id ? { ...t, rating: i + 1 } : t))} />
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTestimonial(testimonial.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input value={testimonial.name} onChange={(e) => setEditedTestimonials(prev => prev.map(t => t.id === testimonial.id ? { ...t, name: e.target.value } : t))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Role (e.g. ADI, Manchester)</Label>
                      <Input value={testimonial.role} onChange={(e) => setEditedTestimonials(prev => prev.map(t => t.id === testimonial.id ? { ...t, role: e.target.value } : t))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Testimonial Content</Label>
                    <Textarea value={testimonial.content} onChange={(e) => setEditedTestimonials(prev => prev.map(t => t.id === testimonial.id ? { ...t, content: e.target.value } : t))} rows={2} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={handleSaveTestimonials} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Testimonials
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sections Tab */}
      <TabsContent value="sections">
        <Card>
          <CardHeader>
            <CardTitle>Section Titles</CardTitle>
            <CardDescription>Edit section headings and toggle visibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedSections.map((section) => (
              <Card key={section.id} className={!section.is_visible ? 'opacity-60' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{section.section_name}</span>
                    <Button variant={section.is_visible ? 'default' : 'outline'} size="sm" onClick={() => handleToggleSectionVisibility(section)} className="gap-2">
                      {section.is_visible ? <><Eye className="h-4 w-4" /> Visible</> : <><EyeOff className="h-4 w-4" /> Hidden</>}
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input value={section.title} onChange={(e) => setEditedSections(prev => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Subtitle</Label>
                      <Input value={section.subtitle || ''} onChange={(e) => setEditedSections(prev => prev.map(s => s.id === section.id ? { ...s, subtitle: e.target.value } : s))} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={handleSaveSections} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Sections
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
