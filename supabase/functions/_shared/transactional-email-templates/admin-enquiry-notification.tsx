import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string | null
  phone?: string | null
  postcode?: string
  courseType?: string
  requestedHours?: number
  preferredTiming?: string
  additionalNotes?: string | null
  isCallback?: boolean
}

const row = { padding: '6px 0', fontSize: '14px' } as const
const label = { color: '#6b7280', width: '140px', display: 'inline-block' } as const

const Email = ({
  name, email, phone, postcode, courseType, requestedHours, preferredTiming, additionalNotes, isCallback,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {isCallback ? `Callback request from ${name}` : `New course enquiry from ${name}`}
    </Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0 }}>
      <Container style={{ padding: '24px', maxWidth: '600px' }}>
        <Heading style={{ fontSize: '20px', color: '#111', margin: '0 0 4px' }}>
          {isCallback ? '📞 New Callback Request' : '📝 New Course Enquiry'}
        </Heading>
        <Text style={{ color: '#6b7280', margin: '0 0 16px' }}>From {name}</Text>

        <Section style={{ background: '#F4F7F6', padding: '16px', borderRadius: '12px' }}>
          <Text style={row}><span style={label}>Name:</span><strong>{name}</strong></Text>
          {email && <Text style={row}><span style={label}>Email:</span>{email}</Text>}
          {phone && <Text style={row}><span style={label}>Phone:</span>{phone}</Text>}
          {postcode && <Text style={row}><span style={label}>Postcode:</span>{postcode}</Text>}
        </Section>

        {!isCallback && (
          <Section style={{ background: '#F4F7F6', padding: '16px', borderRadius: '12px', marginTop: '12px' }}>
            <Text style={row}><span style={label}>Course type:</span>{courseType}</Text>
            <Text style={row}><span style={label}>Hours:</span>{requestedHours}</Text>
            <Text style={row}><span style={label}>Preferred timing:</span>{preferredTiming}</Text>
          </Section>
        )}

        {additionalNotes && (
          <Section style={{ marginTop: '12px' }}>
            <Text style={{ color: '#374151', fontWeight: 600, margin: '0 0 4px' }}>Message</Text>
            <Text style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '10px', margin: 0 }}>
              {additionalNotes}
            </Text>
          </Section>
        )}

        <Hr style={{ margin: '24px 0' }} />
        <Text style={{ fontSize: '12px', color: '#666' }}>
          View and manage this enquiry in the Admin Portal.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: any) =>
    data?.isCallback
      ? `📞 New Callback Request from ${data?.name ?? 'visitor'}`
      : `📝 New Bespoke Course Enquiry from ${data?.name ?? 'visitor'}`,
  displayName: 'Admin enquiry notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '07700 900123',
    postcode: 'SO23 9AB',
    courseType: 'intensive',
    requestedHours: 20,
    preferredTiming: 'weekday-mornings',
    additionalNotes: 'Looking to pass before September.',
    isCallback: false,
  },
} satisfies TemplateEntry
