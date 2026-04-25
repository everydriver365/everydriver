UPDATE instructor_homepage_content
SET quick_actions = quick_actions || jsonb_build_array(
  jsonb_build_object(
    'id', 'accessibility',
    'icon', 'Accessibility',
    'route', '/instructor/accessibility',
    'title', 'Accessibility',
    'display_order', 11
  )
)
WHERE is_active = true
  AND NOT (quick_actions @> '[{"id":"accessibility"}]'::jsonb);