import {
  Body,
  Button,
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

interface CheckInConfirmationProps {
  memberName: string;
  gymName: string;
  gymLogo?: string;
  checkInTime: string;
  totalCheckIns: number;
  currentStreak?: number;
  gymSlug?: string;
}

export const CheckInConfirmation = ({
  memberName,
  gymName,
  gymLogo,
  checkInTime,
  totalCheckIns,
  currentStreak = 0,
  gymSlug,
}: CheckInConfirmationProps) => {
  const formattedTime = new Date(checkInTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Html>
      <Head />
      <Preview>Check-in confirmed at {gymName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {gymLogo && (
            <Section style={logoSection}>
              <Img src={gymLogo} alt={gymName} style={logo} />
            </Section>
          )}

          <Heading style={h1}>Check-in Confirmed! 🎉</Heading>

          <Text style={text}>Hi {memberName},</Text>

          <Text style={text}>
            You've successfully checked in to {gymName}.
          </Text>

          <Section style={statsSection}>
            <div style={statCard}>
              <Text style={statLabel}>Check-in Time</Text>
              <Text style={statValue}>{formattedTime}</Text>
            </div>

            <div style={statCard}>
              <Text style={statLabel}>Total Check-ins</Text>
              <Text style={statValue}>{totalCheckIns}</Text>
            </div>

            {currentStreak > 0 && (
              <div style={statCard}>
                <Text style={statLabel}>Current Streak</Text>
                <Text style={statValue}>{currentStreak} days 🔥</Text>
              </div>
            )}
          </Section>

          <Text style={text}>
            Keep up the great work! Consistency is key to achieving your fitness goals.
          </Text>

          {totalCheckIns % 10 === 0 && totalCheckIns > 0 && (
            <Section style={milestoneSection}>
              <Text style={milestoneText}>
                🎊 Milestone Alert! You've reached {totalCheckIns} check-ins! 🎊
              </Text>
            </Section>
          )}

          {/* Member Portal CTA */}
          {gymSlug && (
            <Section style={portalSection}>
              <Heading style={portalHeading}>Track Your Fitness Journey</Heading>
              <Text style={portalText}>
                Access your member portal to view your progress, track workouts,
                manage diet plans, and see your check-in history.
              </Text>
              <Button
                href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://inkuity.com'}/${gymSlug}/portal/sign-in`}
                style={portalButton}
              >
                Access Member Portal
              </Button>
            </Section>
          )}

          <Text style={footer}>
            Powered by <Link href="https://inkuity.com" style={link}>Inkuity</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CheckInConfirmation;

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

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 24px',
};

const statsSection = {
  margin: '32px 24px',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
};

const statCard = {
  marginBottom: '16px',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px 0',
};

const statValue = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const milestoneSection = {
  margin: '24px',
  padding: '20px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  textAlign: 'center' as const,
};

const milestoneText = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const link = {
  color: '#4f46e5',
  textDecoration: 'underline',
};

const portalSection = {
  margin: '32px 24px',
  padding: '32px 24px',
  backgroundColor: '#eef2ff',
  borderRadius: '8px',
  textAlign: 'center' as const,
};

const portalHeading = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const portalText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 20px 0',
};

const portalButton = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '32px 0 0',
  padding: '0 24px',
  textAlign: 'center' as const,
};
