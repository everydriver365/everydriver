import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHomepageSections, HomepageSection } from '@/hooks/useHomepageSections';

export function HomepageSectionsManager() {
  const { sections, loading, updateSection, refetch } = useHomepageSections();
  const [editedSections, setEditedSections] = useState<HomepageSection[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (sections.length > 0) {
      setEditedSections(sections);
    }
  }, [sections]);

  const handleChange = (id: string, field: keyof HomepageSection, value: string | boolean) => {
    setEditedSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const handleToggleVisibility = async (section: HomepageSection) => {
    const success = await updateSection(section.id, { is_visible: !section.is_visible });
    if (success) {
      toast({
        title: section.is_visible ? 'Section Hidden' : 'Section Visible',
        description: `"${section.section_name}" is now ${section.is_visible ? 'hidden' : 'visible'} on the homepage.`,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const section of editedSections) {
        const original = sections.find(s => s.id === section.id);
        if (original && (
          original.title !== section.title ||
          original.subtitle !== section.subtitle ||
          original.badge_text !== section.badge_text
        )) {
          await updateSection(section.id, {
            title: section.title,
            subtitle: section.subtitle,
            badge_text: section.badge_text,
          });
        }
      }
      toast({
        title: 'Sections Updated',
        description: 'Homepage section content has been saved.',
      });
      await refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save section changes.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Homepage Sections</h3>
          <p className="text-sm text-muted-foreground">
            Control visibility and edit titles for each homepage section
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="space-y-4">
        {editedSections.map((section) => (
          <Card key={section.id} className={!section.is_visible ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{section.section_name}</CardTitle>
                    <CardDescription className="text-xs">
                      Key: <code className="bg-muted px-1 rounded">{section.section_key}</code>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={section.is_visible ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleVisibility(section)}
                    className="gap-2"
                  >
                    {section.is_visible ? (
                      <>
                        <Eye className="h-4 w-4" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Hidden
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`title-${section.id}`}>Section Title</Label>
                  <Input
                    id={`title-${section.id}`}
                    value={section.title}
                    onChange={(e) => handleChange(section.id, 'title', e.target.value)}
                    placeholder="Section title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`badge-${section.id}`}>Badge Text (optional)</Label>
                  <Input
                    id={`badge-${section.id}`}
                    value={section.badge_text || ''}
                    onChange={(e) => handleChange(section.id, 'badge_text', e.target.value)}
                    placeholder="Badge text..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`subtitle-${section.id}`}>Subtitle</Label>
                <Textarea
                  id={`subtitle-${section.id}`}
                  value={section.subtitle || ''}
                  onChange={(e) => handleChange(section.id, 'subtitle', e.target.value)}
                  placeholder="Section subtitle or description..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
