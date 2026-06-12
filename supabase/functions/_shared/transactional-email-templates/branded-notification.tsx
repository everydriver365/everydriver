import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Detail { label: string; value: string }
interface Props {
  brand?: 'everydriver' | 'dsm'
  heading?: string
  preview?: string
  intro?: string | null
  paragraphs?: string[]
  details?: Detail[]
  ctaLabel?: string | null
  ctaUrl?: string | null
  footerNote?: string | null
  signOff?: string | null
}

const ED = { accent: '#2563eb', muted: '#6b7280', text: '#111827', surface: '#F4F7F6' }
const DSM = { accent: '#2D3FE7', muted: '#6b7280', text: '#111827', surface: '#F4F7F6' }

const Email = ({
  brand = 'everydriver',
  heading,
  preview,
  intro,
  paragraphs = [],
  details = [],
  ctaLabel,
  ctaUrl,
  footerNote,
  signOff,
}: Props) => {
  const palette = brand === 'dsm' ? DSM : ED
  const brandLabel = brand === 'dsm' ? 'Driving School Manager' : 'EveryDriver'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview || heading || `Notification from ${brandLabel}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, color: palette.text }}>
        <Container style={{ padding: '28px 24px', maxWidth: '600px' }}>
          <Text style={{ fontSize: '12px', color: palette.muted, letterSpacing: '1px', margin: '0 0 16px' }}>
            {brandLabel.toUpperCase()}
          </Text>
          {heading && (
            <Heading style={{ fontSize: '22px', color: palette.text, margin: '0 0 12px', lineHeight: 1.3 }}>
              {heading}
            </Heading>
          )}
          {intro && (
            <Text style={{ color: palette.text, margin: '0 0 16px', fontSize: '15px', lineHeight: 1.55 }}>
              {intro}
            </Text>
          )}
          {paragraphs.map((p, i) => (
            <Text key={i} style={{ color: palette.text, margin: '0 0 12px', fontSize: '14px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {p}
            </Text>
          ))}
          {details.length > 0 && (
            <Section style={{ background: palette.surface, padding: '16px', borderRadius: '12px', margin: '16px 0' }}>
              {details.map((d, i) => (
                <Text key={i} style={{ margin: '4px 0', fontSize: '14px' }}>
                  <span style={{ color: palette.muted, display: 'inline-block', width: '140px' }}>{d.label}:</span>
                  <strong style={{ color: palette.text }}>{d.value}</strong>
                </Text>
              ))}
            </Section>
          )}
          {ctaUrl && ctaLabel && (
            <Section style={{ margin: '20px 0' }}>
              <Button
                href={ctaUrl}
                style={{ background: palette.accent, color: '#ffffff', padding: '12px 22px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}
              >
                {ctaLabel}
              </Button>
              <Text style={{ fontSize: '12px', color: palette.muted, margin: '8px 0 0' }}>
                Or open this link: <Link href={ctaUrl} style={{ color: palette.accent }}>{ctaUrl}</Link>
              </Text>
            </Section>
          )}
          {signOff && (
            <Text style={{ color: palette.text, margin: '16px 0 0', fontSize: '14px' }}>{signOff}</Text>
          )}
          <Hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
          <Text style={{ fontSize: '12px', color: palette.muted, margin: 0 }}>
            {footerNote || `${brandLabel} \u2014 driving lessons made simple.`}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: any) => data?.subject || data?.heading || 'Notification',
  displayName: 'Branded notification',
  previewData: {
    brand: 'everydriver',
    heading: 'Hello from EveryDriver',
    intro: 'This is a preview of the unified notification template.',
    paragraphs: ['It supports plain paragraphs.', 'And multiple of them.'],
    details: [{ label: 'Reference', value: 'ABC-123' }, { label: 'Amount', value: '£42.00' }],
    ctaLabel: 'Open dashboard',
    ctaUrl: 'https://everydriver.co.uk',
    footerNote: 'EveryDriver — driving lessons made simple.',
  },
} satisfies TemplateEntry
