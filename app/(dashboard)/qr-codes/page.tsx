import { getQRCodes } from '@/lib/actions/gyms'
import { QRCodeList } from '@/components/dashboard/qr-code/qr-code-list'

export const metadata = {
  title: 'QR Codes - Inkuity',
  description: 'Manage your gym QR codes',
}

export default async function QRCodesPage() {
  const { data: qrCodes } = await getQRCodes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and manage QR codes for your gyms.
        </p>
      </div>

      <QRCodeList qrCodes={qrCodes} />
    </div>
  )
}
