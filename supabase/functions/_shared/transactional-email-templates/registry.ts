import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: (props: any) => React.ReactElement
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: (data: any) => string
}

import { template as autoInvoice } from './auto-invoice.tsx'
import { template as adminEnquiryNotification } from './admin-enquiry-notification.tsx'
import { template as contactEnquiryConfirmation } from './contact-enquiry-confirmation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'auto-invoice': autoInvoice,
  'admin-enquiry-notification': adminEnquiryNotification,
  'contact-enquiry-confirmation': contactEnquiryConfirmation,
}
