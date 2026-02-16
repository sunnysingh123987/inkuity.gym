import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface InactiveMemberCheckInProps {
  ownerName: string;
  memberName: string;
  memberEmail: string;
  gymName: string;
  membershipStatus: string;
  subscriptionEndDate?: string;
  checkInTime: string;
  gymSlug: string;
}

export const InactiveMemberCheckIn = ({
  ownerName,
  memberName,
  memberEmail,
  gymName,
  membershipStatus,
  subscriptionEndDate,
  checkInTime,
  gymSlug,
}: InactiveMemberCheckInProps) => {
  const formattedTime = new Date(checkInTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusColors: Record<string, { bg: string; text: string }> = {
    expired: { bg: '#fef2f2', text: '#991b1b' },
    suspended: { bg: '#fff7ed', text: '#9a3412' },
    cancelled: { bg: '#fef2f2', text: '#991b1b' },
    pending: { bg: '#fffbeb', text: '#92400e' },
  };

  const colors = statusColors[membershipStatus] || statusColors.expired;

  return (
    <Html>
      <Head />
      <Preview>Inactive member {memberName} checked in at {gymName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={alertBanner}>
            <Text style={alertIcon}>&#9888;</Text>
            <Text style={alertText}>Inactive Member Check-in Alert</Text>
          </Section>

          <Heading style={h1}>Member Check-in Notice</Heading>

          <Text style={text}>Hi {ownerName},</Text>

          <Text style={text}>
            A member with an <strong>{membershipStatus}</strong> subscription has just checked in at {gymName}.
          </Text>

          <Section style={memberSection}>
            <Text style={sectionTitle}>Member Details</Text>
            <div style={detailRow}>
              <Text style={detailLabel}>Name</Text>
              <Text style={detailValue}>{memberName}</Text>
            </div>
            <div style={detailRow}>
              <Text style={detailLabel}>Email</Text>
              <Text style={detailValue}>{memberEmail}</Text>
            </div>
            <div style={detailRow}>
              <Text style={detailLabel}>Status</Text>
              <Text style={{ ...statusBadge, backgroundColor: colors.bg, color: colors.text }}>
                {membershipStatus.toUpperCase()}
              </Text>
            </div>
            {subscriptionEndDate && (
              <div style={detailRow}>
                <Text style={detailLabel}>Expired On</Text>
                <Text style={detailValue}>
                  {new Date(subscriptionEndDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </div>
            )}
            <div style={detailRow}>
              <Text style={detailLabel}>Check-in Time</Text>
              <Text style={detailValue}>{formattedTime}</Text>
            </div>
          </Section>

          <Text style={text}>
            You may want to reach out to this member about renewing their subscription.
          </Text>

          <Text style={footer}>
            Powered by <Link href="https://inkuity.com" style={link}>Inkuity</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InactiveMemberCheckIn;

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

const alertBanner = {
  backgroundColor: '#fef2f2',
  padding: '16px 24px',
  textAlign: 'center' as const,
  borderBottom: '2px solid #fecaca',
};

const alertIcon = {
  fontSize: '24px',
  margin: '0 0 4px 0',
  color: '#dc2626',
};

const alertText = {
  color: '#991b1b',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 20px',
  padding: '0 24px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 24px',
};

const memberSection = {
  margin: '24px',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const sectionTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0 0 16px 0',
};

const detailRow = {
  display: 'flex',
  marginBottom: '12px',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
  minWidth: '120px',
};

const detailValue = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '500' as const,
  margin: '0',
};

const statusBadge = {
  fontSize: '12px',
  fontWeight: 'bold' as const,
  margin: '0',
  padding: '2px 8px',
  borderRadius: '4px',
  display: 'inline-block',
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
