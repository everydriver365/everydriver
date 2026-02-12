import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Save, Plus, Trash2, Eye, EyeOff, GripVertical,
  ArrowUp, ArrowDown, Globe, Image, Video, Type, LayoutGrid, FileText
} from 'lucide-react';
import { CMSImageUpload } from './CMSImageUpload';
import { useMarketingCMS, MarketingSection } from '@/hooks/useMarketingCMS';
import { toast } from 'sonner';

const sectionTypes = [
  { value: 'hero', label: 'Hero Banner', icon: LayoutGrid },
  { value: 'content', label: 'Content Block', icon: Type },
  { value: 'features', label: 'Features Grid', icon: LayoutGrid },
  { value: 'stats', label: 'Statistics', icon: FileText },
  { value: 'testimonials', label: 'Testimonials', icon: Type },
  { value: 'cta', label: 'Call to Action', icon: Globe },
  { value: 'image_text', label: 'Image + Text', icon: Image },
  { value: 'video', label: 'Video Block', icon: Video },
  { value: 'pricing', label: 'Pricing Table', icon: FileText },
  { value: 'faq', label: 'FAQ Section', icon: Type },
];

export function MarketingPageBuilder() {
  const {
    pages, sections, selectedPageId, setSelectedPageId, loading,
    updatePage, addSection, updateSection, deleteSection, reorderSections,
  } = useMarketingCMS();

  const [saving, setSaving] = useState(false);
  const [editedSections, setEditedSections] = useState<Record<string, Partial<MarketingSection>>>({});
  const [editedPageMeta, setEditedPageMeta] = useState<Record<string, any>>({});

  const selectedPage = pages.find(p => p.id === selectedPageId);

  const handlePageMetaChange = (field: string, value: any) => {
    if (!selectedPageId) return;
    setEditedPageMeta(prev => ({
      ...prev,
      [selectedPageId]: { ...(prev[selectedPageId] || {}), [field]: value }
    }));
  };

  const handleSavePageMeta = async () => {
    if (!selectedPageId || !editedPageMeta[selectedPageId]) return;
    setSaving(true);
    const success = await updatePage(selectedPageId, editedPageMeta[selectedPageId]);
    if (success) {
      toast.success('Page settings saved');
      setEditedPageMeta(prev => { const next = { ...prev }; delete next[selectedPageId]; return next; });
    }
    setSaving(false);
  };

  const handleSectionChange = (sectionId: string, field: string, value: any) => {
    setEditedSections(prev => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [field]: value }
    }));
  };

  const handleContentChange = (sectionId: string, key: string, value: any) => {
    const existing = editedSections[sectionId]?.content || sections.find(s => s.id === sectionId)?.content || {};
    handleSectionChange(sectionId, 'content', { ...existing, [key]: value });
  };

  const handleSaveSection = async (sectionId: string) => {
    if (!editedSections[sectionId]) return;
    setSaving(true);
    const success = await updateSection(sectionId, editedSections[sectionId]);
    if (success) {
      toast.success('Section saved');
      setEditedSections(prev => { const next = { ...prev }; delete next[sectionId]; return next; });
    }
    setSaving(false);
  };

  const handleAddSection = async (type: string) => {
    if (!selectedPageId) return;
    await addSection(selectedPageId, {
      section_type: type,
      section_key: `${type}_${Date.now()}`,
      title: `New ${sectionTypes.find(t => t.value === type)?.label || 'Section'}`,
      content: getDefaultContent(type),
    });
    toast.success('Section added');
  };

  const handleDeleteSection = async (id: string) => {
    if (confirm('Delete this section? This cannot be undone.')) {
      await deleteSection(id);
      toast.success('Section deleted');
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    await reorderSections(reordered);
  };

  const handleToggleVisibility = async (section: MarketingSection) => {
    await updateSection(section.id, { is_visible: !section.is_visible });
  };

  const getFieldValue = (section: MarketingSection, field: keyof MarketingSection) => {
    return editedSections[section.id]?.[field] ?? section[field];
  };

  const getContentValue = (section: MarketingSection, key: string) => {
    const content = editedSections[section.id]?.content || section.content || {};
    return (content as Record<string, any>)[key] || '';
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
      {/* Page Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedPageId || ''} onValueChange={setSelectedPageId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a page" />
          </SelectTrigger>
          <SelectContent>
            {pages.map(page => (
              <SelectItem key={page.id} value={page.id}>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {page.page_title}
                  {!page.is_published && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPage && (
          <Badge variant={selectedPage.is_published ? 'default' : 'secondary'}>
            {selectedPage.is_published ? 'Published' : 'Draft'}
          </Badge>
        )}
      </div>

      {selectedPage && (
        <Tabs defaultValue="sections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sections">Page Sections</TabsTrigger>
            <TabsTrigger value="settings">Page Settings</TabsTrigger>
          </TabsList>

          {/* Page Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Page Settings & SEO</CardTitle>
                <CardDescription>Configure page metadata and publishing status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Page Title</Label>
                    <Input
                      value={editedPageMeta[selectedPageId!]?.page_title ?? selectedPage.page_title}
                      onChange={e => handlePageMetaChange('page_title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Title</Label>
                    <Input
                      value={editedPageMeta[selectedPageId!]?.meta_title ?? selectedPage.meta_title ?? ''}
                      onChange={e => handlePageMetaChange('meta_title', e.target.value)}
                      placeholder="Max 60 characters"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={editedPageMeta[selectedPageId!]?.meta_description ?? selectedPage.meta_description ?? ''}
                    onChange={e => handlePageMetaChange('meta_description', e.target.value)}
                    placeholder="Max 160 characters"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editedPageMeta[selectedPageId!]?.is_published ?? selectedPage.is_published}
                    onCheckedChange={v => handlePageMetaChange('is_published', v)}
                  />
                  <Label>Published</Label>
                </div>
                <Button onClick={handleSavePageMeta} disabled={saving || !editedPageMeta[selectedPageId!]}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections">
            <div className="space-y-4">
              {/* Add Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add New Section</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sectionTypes.map(type => (
                      <Button
                        key={type.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSection(type.value)}
                        className="gap-2"
                      >
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Section List */}
              {sections.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No sections yet. Add one above to start building this page.
                  </CardContent>
                </Card>
              ) : (
                sections.map((section, index) => (
                  <Card key={section.id} className={!section.is_visible ? 'opacity-60' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {sectionTypes.find(t => t.value === section.section_type)?.label || section.section_type}
                          </Badge>
                          <span className="text-sm font-medium">{section.title || 'Untitled'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleMoveSection(index, 'up')} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleMoveSection(index, 'down')} disabled={index === sections.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(section)}>
                            {section.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSection(section.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {renderSectionEditor(section, getFieldValue, getContentValue, handleSectionChange, handleContentChange)}
                      
                      <Button
                        size="sm"
                        onClick={() => handleSaveSection(section.id)}
                        disabled={saving || !editedSections[section.id]}
                      >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Section
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function getDefaultContent(type: string): Record<string, any> {
  switch (type) {
    case 'hero':
      return { headline: '', subheadline: '', cta_text: 'Get Started', cta_link: '/instructor-app/signup', badge_text: '' };
    case 'features':
      return { items: [{ icon: 'Star', title: 'Feature', description: 'Description' }] };
    case 'stats':
      return { items: [{ value: '0', label: 'Stat' }] };
    case 'testimonials':
      return { items: [{ name: 'Name', role: 'Role', content: 'Testimonial text', rating: 5 }] };
    case 'cta':
      return { headline: '', subtext: '', button_text: 'Get Started', button_link: '/instructor-app/signup' };
    case 'image_text':
      return { body: '', image_position: 'right' };
    case 'video':
      return { caption: '' };
    case 'pricing':
      return { items: [{ name: 'Plan', price: '0', features: ['Feature 1'] }] };
    case 'faq':
      return { items: [{ question: 'Question?', answer: 'Answer.' }] };
    default:
      return { body: '' };
  }
}

function renderSectionEditor(
  section: MarketingSection,
  getField: (s: MarketingSection, f: keyof MarketingSection) => any,
  getContent: (s: MarketingSection, k: string) => any,
  onFieldChange: (id: string, field: string, value: any) => void,
  onContentChange: (id: string, key: string, value: any) => void,
) {
  const id = section.id;

  return (
    <div className="space-y-4">
      {/* Common fields */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Section Title</Label>
          <Input
            value={getField(section, 'title') || ''}
            onChange={e => onFieldChange(id, 'title', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Subtitle</Label>
          <Input
            value={getField(section, 'subtitle') || ''}
            onChange={e => onFieldChange(id, 'subtitle', e.target.value)}
          />
        </div>
      </div>

      {/* Image Upload */}
      <CMSImageUpload
        value={getField(section, 'image_url')}
        onChange={url => onFieldChange(id, 'image_url', url)}
        bucket="marketing-images"
        folder={section.section_type}
        label="Section Image"
        aspectRatio={section.section_type === 'hero' ? 16 / 9 : undefined}
      />

      {/* Video URL */}
      {(section.section_type === 'video' || section.section_type === 'hero') && (
        <div className="space-y-1">
          <Label className="text-xs">Video URL (YouTube embed or MP4)</Label>
          <Input
            value={getField(section, 'video_url') || ''}
            onChange={e => onFieldChange(id, 'video_url', e.target.value)}
            placeholder="https://youtube.com/embed/... or /path/to/video.mp4"
          />
        </div>
      )}

      {/* Type-specific content editors */}
      {section.section_type === 'hero' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Badge Text</Label>
            <Input value={getContent(section, 'badge_text')} onChange={e => onContentChange(id, 'badge_text', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Headline</Label>
            <Input value={getContent(section, 'headline')} onChange={e => onContentChange(id, 'headline', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subheadline</Label>
            <Textarea value={getContent(section, 'subheadline')} onChange={e => onContentChange(id, 'subheadline', e.target.value)} rows={2} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">CTA Text</Label>
              <Input value={getContent(section, 'cta_text')} onChange={e => onContentChange(id, 'cta_text', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CTA Link</Label>
              <Input value={getContent(section, 'cta_link')} onChange={e => onContentChange(id, 'cta_link', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {section.section_type === 'content' && (
        <div className="space-y-1">
          <Label className="text-xs">Body Content</Label>
          <Textarea value={getContent(section, 'body')} onChange={e => onContentChange(id, 'body', e.target.value)} rows={4} placeholder="Write section content..." />
        </div>
      )}

      {section.section_type === 'image_text' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Body Content</Label>
            <Textarea value={getContent(section, 'body')} onChange={e => onContentChange(id, 'body', e.target.value)} rows={4} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Image Position</Label>
            <Select value={getContent(section, 'image_position') || 'right'} onValueChange={v => onContentChange(id, 'image_position', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {section.section_type === 'cta' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Headline</Label>
            <Input value={getContent(section, 'headline')} onChange={e => onContentChange(id, 'headline', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subtext</Label>
            <Textarea value={getContent(section, 'subtext')} onChange={e => onContentChange(id, 'subtext', e.target.value)} rows={2} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Button Text</Label>
              <Input value={getContent(section, 'button_text')} onChange={e => onContentChange(id, 'button_text', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Button Link</Label>
              <Input value={getContent(section, 'button_link')} onChange={e => onContentChange(id, 'button_link', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {section.section_type === 'video' && (
        <div className="space-y-1">
          <Label className="text-xs">Caption</Label>
          <Input value={getContent(section, 'caption')} onChange={e => onContentChange(id, 'caption', e.target.value)} />
        </div>
      )}

      {section.section_type === 'features' && (
        <FeaturesListEditor
          items={getContent(section, 'items') || []}
          onChange={items => onContentChange(id, 'items', items)}
        />
      )}

      {section.section_type === 'stats' && (
        <StatsListEditor
          items={getContent(section, 'items') || []}
          onChange={items => onContentChange(id, 'items', items)}
        />
      )}

      {section.section_type === 'testimonials' && (
        <TestimonialsListEditor
          items={getContent(section, 'items') || []}
          onChange={items => onContentChange(id, 'items', items)}
        />
      )}

      {section.section_type === 'faq' && (
        <FAQListEditor
          items={getContent(section, 'items') || []}
          onChange={items => onContentChange(id, 'items', items)}
        />
      )}

      {section.section_type === 'pricing' && (
        <PricingListEditor
          items={getContent(section, 'items') || []}
          onChange={items => onContentChange(id, 'items', items)}
        />
      )}
    </div>
  );
}

// --- List editors ---

function FeaturesListEditor({ items, onChange }: { items: any[]; onChange: (items: any[]) => void }) {
  const parsed = Array.isArray(items) ? items : [];
  const addItem = () => onChange([...parsed, { icon: 'Star', title: '', description: '' }]);
  const removeItem = (i: number) => onChange(parsed.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => onChange(parsed.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Feature Items</Label>
      {parsed.map((item: any, i: number) => (
        <div key={i} className="flex gap-2 items-start border rounded-lg p-3">
          <div className="flex-1 grid gap-2 md:grid-cols-3">
            <Input placeholder="Icon" value={item.icon || ''} onChange={e => updateItem(i, 'icon', e.target.value)} />
            <Input placeholder="Title" value={item.title || ''} onChange={e => updateItem(i, 'title', e.target.value)} />
            <Input placeholder="Description" value={item.description || ''} onChange={e => updateItem(i, 'description', e.target.value)} />
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Feature</Button>
    </div>
  );
}

function StatsListEditor({ items, onChange }: { items: any[]; onChange: (items: any[]) => void }) {
  const parsed = Array.isArray(items) ? items : [];
  const addItem = () => onChange([...parsed, { value: '0', label: '' }]);
  const removeItem = (i: number) => onChange(parsed.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => onChange(parsed.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Stats</Label>
      {parsed.map((item: any, i: number) => (
        <div key={i} className="flex gap-2 items-center border rounded-lg p-3">
          <Input className="w-24" placeholder="Value" value={item.value || ''} onChange={e => updateItem(i, 'value', e.target.value)} />
          <Input className="flex-1" placeholder="Label" value={item.label || ''} onChange={e => updateItem(i, 'label', e.target.value)} />
          <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Stat</Button>
    </div>
  );
}

function TestimonialsListEditor({ items, onChange }: { items: any[]; onChange: (items: any[]) => void }) {
  const parsed = Array.isArray(items) ? items : [];
  const addItem = () => onChange([...parsed, { name: '', role: '', content: '', rating: 5 }]);
  const removeItem = (i: number) => onChange(parsed.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => onChange(parsed.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Testimonials</Label>
      {parsed.map((item: any, i: number) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex justify-between">
            <div className="grid gap-2 md:grid-cols-2 flex-1 mr-2">
              <Input placeholder="Name" value={item.name || ''} onChange={e => updateItem(i, 'name', e.target.value)} />
              <Input placeholder="Role" value={item.role || ''} onChange={e => updateItem(i, 'role', e.target.value)} />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <Textarea placeholder="Content" value={item.content || ''} onChange={e => updateItem(i, 'content', e.target.value)} rows={2} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Testimonial</Button>
    </div>
  );
}

function FAQListEditor({ items, onChange }: { items: any[]; onChange: (items: any[]) => void }) {
  const parsed = Array.isArray(items) ? items : [];
  const addItem = () => onChange([...parsed, { question: '', answer: '' }]);
  const removeItem = (i: number) => onChange(parsed.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => onChange(parsed.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">FAQ Items</Label>
      {parsed.map((item: any, i: number) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <Input className="flex-1" placeholder="Question" value={item.question || ''} onChange={e => updateItem(i, 'question', e.target.value)} />
            <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <Textarea placeholder="Answer" value={item.answer || ''} onChange={e => updateItem(i, 'answer', e.target.value)} rows={2} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add FAQ</Button>
    </div>
  );
}

function PricingListEditor({ items, onChange }: { items: any[]; onChange: (items: any[]) => void }) {
  const parsed = Array.isArray(items) ? items : [];
  const addItem = () => onChange([...parsed, { name: '', price: '0', features: [''] }]);
  const removeItem = (i: number) => onChange(parsed.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => onChange(parsed.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Pricing Plans</Label>
      {parsed.map((item: any, i: number) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <Input placeholder="Plan Name" value={item.name || ''} onChange={e => updateItem(i, 'name', e.target.value)} />
            <Input className="w-24" placeholder="Price" value={item.price || ''} onChange={e => updateItem(i, 'price', e.target.value)} />
            <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <Textarea
            placeholder="Features (one per line)"
            value={Array.isArray(item.features) ? item.features.join('\n') : ''}
            onChange={e => updateItem(i, 'features', e.target.value.split('\n'))}
            rows={3}
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Plan</Button>
    </div>
  );
}
