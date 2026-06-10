import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: (props: any) => React.ReactElement
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: (data: any) => string
}

import { template as autoInvoice } from './auto-invoice.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'auto-invoice': autoInvoice,
}
