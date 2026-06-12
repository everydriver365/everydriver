import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  isCallback?: boolean
  message?: string | null
}

const Email = ({ name, isCallback, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {isCallback ? 'We have your callback request' : "We've received your message"}
    </Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0 }}>
      <Container style={{ padding: '24px', maxWidth: '600px' }}>
        <Heading style={{ fontSize: '22px', color: '#111', margin: '0 0 8px' }}>
          {isCallback ? 'Thanks — we\u2019ll call you back' : 'Thanks for getting in touch'}
        </Heading>
        <Text style={{ color: '#374151', margin: '0 0 16px' }}>
          Hi {name || 'there'},
        </Text>
        <Text style={{ color: '#374151', margin: '0 0 12px' }}>
          {isCallback
            ? "We've received your callback request and a member of the EveryDriver team will be in touch as soon as possible."
            : "We've received your message and a member of the EveryDriver team will get back to you shortly — usually within one working day."}
        </Text>

        {message && (
          <Section style={{ background: '#F4F7F6', padding: '16px', borderRadius: '12px', marginTop: '8px' }}>
            <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase' }}>
              Your message
            </Text>
            <Text style={{ color: '#111827', margin: 0, whiteSpace: 'pre-wrap' }}>{message}</Text>
          </Section>
        )}

        <Hr style={{ margin: '24px 0' }} />
        <Text style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
          EveryDriver \u2014 driving lessons made simple.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: any) =>
    data?.isCallback
      ? "We've received your callback request \u2013 EveryDriver"
      : "We've received your message \u2013 EveryDriver",
  displayName: 'Contact enquiry confirmation',
  previewData: {
    name: 'Jane',
    isCallback: false,
    message: 'I\u2019d like to know about intensive courses near SO23.',
  },
} satisfies TemplateEntry
