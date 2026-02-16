// QR Code generation utilities
import QRCode from 'qrcode';

interface QRGenerationOptions {
  code: string;
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  width?: number;
  frameStyle?: 'square' | 'circle' | 'rounded';
  gymName?: string;
  label?: string;
}

/**
 * Generate QR code data URL
 */
export async function generateQRCodeDataURL(
  options: QRGenerationOptions
): Promise<string> {
  const {
    code,
    primaryColor = '#000000',
    backgroundColor = '#FFFFFF',
    width = 512,
  } = options;

  const scanUrl = generateScanUrl(code);

  return QRCode.toDataURL(scanUrl, {
    width,
    margin: 2,
    color: {
      dark: primaryColor,
      light: backgroundColor,
    },
    errorCorrectionLevel: 'H', // High error correction to allow for logo overlay
    type: 'image/png',
  });
}

/**
 * Generate QR code SVG string
 */
export async function generateQRCodeSVG(
  options: QRGenerationOptions
): Promise<string> {
  const {
    code,
    primaryColor = '#000000',
    backgroundColor = '#FFFFFF',
    width = 512,
  } = options;

  const scanUrl = generateScanUrl(code);

  return QRCode.toString(scanUrl, {
    width,
    margin: 2,
    color: {
      dark: primaryColor,
      light: backgroundColor,
    },
    errorCorrectionLevel: 'H',
    type: 'svg',
  });
}

/**
 * Generate QR code Buffer for file download
 */
export async function generateQRCodeBuffer(
  options: QRGenerationOptions
): Promise<Buffer> {
  const {
    code,
    primaryColor = '#000000',
    backgroundColor = '#FFFFFF',
    width = 1024,
  } = options;

  const scanUrl = generateScanUrl(code);

  return QRCode.toBuffer(scanUrl, {
    width,
    margin: 2,
    color: {
      dark: primaryColor,
      light: backgroundColor,
    },
    errorCorrectionLevel: 'H',
    type: 'png',
  });
}

/**
 * Generate the scan URL that the QR code will redirect to
 * Format: https://inkuity.com/s/{code}
 */
export function generateScanUrl(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inkuity.com';
  return `${baseUrl}/s/${code}`;
}

/**
 * Generate a unique QR code identifier
 * Format: GYM-{timestamp}-{random}
 */
export function generateQRCodeIdentifier(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GYM-${timestamp}-${random}`;
}

/**
 * Generate gym slug from name
 */
export function generateGymSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Generate QR code with custom styling options
 */
export interface StyledQROptions {
  code: string;
  primaryColor: string;
  backgroundColor: string;
  width: number;
  includeLogo: boolean;
  logoUrl?: string;
  frameText?: string;
}

export async function generateStyledQRCode(
  options: StyledQROptions
): Promise<{ png: Buffer; svg: string; dataUrl: string }> {
  const [dataUrl, svg, png] = await Promise.all([
    generateQRCodeDataURL(options),
    generateQRCodeSVG(options),
    generateQRCodeBuffer(options),
  ]);

  return { png, svg, dataUrl };
}

/**
 * Validate QR code format
 */
export function isValidQRCode(code: string): boolean {
  const pattern = /^GYM-[A-Z0-9]+-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Get QR code preview with styling
 */
export function getQRPreviewStyles(options: {
  primaryColor?: string;
  backgroundColor?: string;
  frameStyle?: string;
}): React.CSSProperties {
  const { primaryColor = '#000000', backgroundColor = '#FFFFFF', frameStyle = 'square' } = options;

  const borderRadius = {
    square: '8px',
    circle: '50%',
    rounded: '16px',
  }[frameStyle] || '8px';

  return {
    backgroundColor,
    border: `3px solid ${primaryColor}`,
    borderRadius,
    padding: '20px',
    display: 'inline-block',
  };
}
