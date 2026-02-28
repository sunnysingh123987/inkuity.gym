import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AnnouncementEmailProps {
  memberName: string;
  gymName: string;
  gymLogo?: string;
  announcementTitle: string;
  announcementMessage: string;
  announcementType: 'info' | 'warning' | 'emergency' | 'holiday' | 'closure';
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  info: { label: 'Information', color: '#3b82f6' },
  warning: { label: 'Warning', color: '#f59e0b' },
  emergency: { label: 'Emergency', color: '#ef4444' },
  holiday: { label: 'Holiday', color: '#a855f7' },
  closure: { label: 'Closure', color: '#6b7280' },
};

export const AnnouncementEmail = ({
  memberName,
  gymName,
  gymLogo,
  announcementTitle,
  announcementMessage,
  announcementType,
}: AnnouncementEmailProps) => {
  const typeConfig = TYPE_LABELS[announcementType] || TYPE_LABELS.info;

  return (
    <Html>
      <Head />
      <Preview>{announcementTitle} - {gymName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {gymLogo && (
            <Section style={logoSection}>
              <Img src={gymLogo} alt={gymName} style={logo} />
            </Section>
          )}

          <Section style={{ ...typeBadge, backgroundColor: typeConfig.color }}>
            <Text style={typeBadgeText}>{typeConfig.label}</Text>
          </Section>

          <Heading style={h1}>{announcementTitle}</Heading>

          <Text style={text}>Hi {memberName},</Text>

          <Text style={text}>
            {gymName} has a new announcement for you:
          </Text>

          <Section style={messageSection}>
            <Text style={messageText}>{announcementMessage}</Text>
          </Section>

          <Text style={text}>
            If you have any questions, please contact your gym directly.
          </Text>

          <Text style={footer}>
            Powered by <Link href="https://inkuity.com" style={link}>Inkuity</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AnnouncementEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoSection = {
  padding: '32px 0',
  textAlign: 'center' as const,
};

const logo = {
  height: '48px',
  margin: '0 auto',
};

const typeBadge = {
  margin: '24px 24px 0',
  padding: '6px 16px',
  borderRadius: '4px',
  textAlign: 'center' as const,
  width: 'fit-content',
};

const typeBadgeText = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0',
  letterSpacing: '0.5px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '20px 0 20px',
  padding: '0 24px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 24px',
};

const messageSection = {
  margin: '24px 24px',
  padding: '20px 24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  borderLeft: '4px solid #06b6d4',
};

const messageText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const link = {
  color: '#4f46e5',
  textDecoration: 'underline',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '32px 0 0',
  padding: '0 24px',
  textAlign: 'center' as const,
};
