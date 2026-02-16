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

interface WelcomeEmailProps {
  memberName: string;
  gymName: string;
  gymLogo?: string;
}

export const WelcomeEmail = ({
  memberName,
  gymName,
  gymLogo,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {gymName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          {gymLogo && (
            <Section style={logoSection}>
              <Img src={gymLogo} alt={gymName} style={logo} />
            </Section>
          )}

          <Heading style={h1}>Welcome to {gymName}!</Heading>

          <Text style={text}>Hi {memberName},</Text>

          <Text style={text}>
            Thank you for checking in! We're excited to have you as a member of our gym community.
          </Text>

          <Text style={text}>
            Your check-in has been recorded. You can now track your fitness journey with us.
          </Text>

          <Section style={benefitsSection}>
            <Heading style={h2}>What's Next?</Heading>
            <Text style={bulletText}>✓ Track your check-in history</Text>
            <Text style={bulletText}>✓ Monitor your progress</Text>
            <Text style={bulletText}>✓ Build your workout streak</Text>
            <Text style={bulletText}>✓ Stay motivated with analytics</Text>
          </Section>

          <Text style={text}>
            If you have any questions, feel free to reach out to our team.
          </Text>

          <Text style={footer}>
            Powered by <Link href="https://inkuity.com" style={link}>Inkuity</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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

const h2 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 12px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 24px',
};

const bulletText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
  padding: '0 24px',
};

const benefitsSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
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
