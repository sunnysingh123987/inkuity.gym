import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';

interface PINEmailProps {
  memberName: string;
  gymName: string;
  pin: string;
  isNewPIN: boolean;
}

export function PINEmail({
  memberName,
  gymName,
  pin,
  isNewPIN,
}: PINEmailProps) {
  const previewText = isNewPIN
    ? `Your PIN for ${gymName} member portal`
    : `New PIN for ${gymName} member portal`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{gymName}</Heading>
            <Text style={subtitle}>Member Portal</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {memberName},</Text>

            {isNewPIN ? (
              <Text style={paragraph}>
                Welcome to the {gymName} member portal! Here's your 4-digit PIN
                to access your account:
              </Text>
            ) : (
              <Text style={paragraph}>
                Here's your PIN to access the {gymName} member portal:
              </Text>
            )}

            {/* PIN Display */}
            <Section style={pinBox}>
              <Text style={pinText}>{pin}</Text>
            </Section>

            <Text style={paragraph}>
              Use this PIN along with your email address to sign in at the
              member portal.
            </Text>

            {isNewPIN && (
              <>
                <Hr style={divider} />
                <Heading style={h2}>What you can do in the portal:</Heading>
                <Text style={listItem}>✓ View your check-in history and streaks</Text>
                <Text style={listItem}>✓ Create and manage workout routines</Text>
                <Text style={listItem}>✓ Track your workout sessions</Text>
                <Text style={listItem}>✓ Monitor your diet and nutrition</Text>
                <Text style={listItem}>✓ See your fitness progress over time</Text>
              </>
            )}
          </Section>

          {/* Security Note */}
          <Section style={securitySection}>
            <Text style={securityText}>
              🔒 <strong>Keep your PIN secure.</strong> This PIN is personal to
              you and should not be shared with anyone.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This PIN is for {gymName} member portal access only.
            </Text>
            <Text style={footerText}>
              If you didn't request this PIN, please contact the gym
              immediately.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#4f46e5',
  color: '#ffffff',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const subtitle = {
  color: '#e0e7ff',
  fontSize: '14px',
  margin: '8px 0 0',
  padding: '0',
};

const content = {
  padding: '40px 32px',
};

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
  color: '#1f2937',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
  color: '#4b5563',
};

const pinBox = {
  backgroundColor: '#f3f4f6',
  border: '2px dashed #4f46e5',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center' as const,
  margin: '32px 0',
};

const pinText = {
  fontSize: '48px',
  fontWeight: 'bold',
  letterSpacing: '12px',
  color: '#4f46e5',
  margin: '0',
  fontFamily: 'monospace',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const h2 = {
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  color: '#1f2937',
};

const listItem = {
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
  color: '#4b5563',
};

const securitySection = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 32px 24px',
};

const securityText = {
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  color: '#78350f',
};

const footer = {
  padding: '24px 32px',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '18px',
  margin: '4px 0',
  color: '#6b7280',
  textAlign: 'center' as const,
};

export default PINEmail;
