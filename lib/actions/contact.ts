'use server'

import { resend } from '@/lib/email/client'

const CONTACT_EMAIL = 'contact@inkuity.com'
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'noreply@inkuity.com'

export async function requestDemo(data: {
  name: string
  email: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  if (!data.name.trim()) {
    return { success: false, error: 'Name is required' }
  }
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { success: false, error: 'A valid email address is required' }
  }
  if (!data.message.trim()) {
    return { success: false, error: 'Message is required' }
  }

  try {
    // Send notification to Inkuity team
    const { error } = await resend.emails.send({
      from: `Inkuity Website <${FROM_EMAIL}>`,
      to: [CONTACT_EMAIL],
      replyTo: data.email,
      subject: `Demo Request from ${data.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; border-radius: 12px; overflow: hidden;">
          <div style="height: 4px; background: linear-gradient(to right, #06b6d4, #a855f7, #ec4899);"></div>
          <div style="padding: 32px;">
            <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 24px;">New Demo Request</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; width: 80px;">Name</td>
                <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">${escapeHtml(data.name)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Email</td>
                <td style="padding: 8px 0; color: #06b6d4; font-size: 14px;">${escapeHtml(data.email)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; vertical-align: top;">Message</td>
                <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">${escapeHtml(data.message).replace(/\n/g, '<br/>')}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send demo request email:', error)
      return { success: false, error: 'Failed to send your request. Please try again.' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Demo request error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
