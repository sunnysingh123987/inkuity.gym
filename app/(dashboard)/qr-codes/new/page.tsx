import { CreateQRCodeForm } from '@/components/dashboard/qr-code/create-qr-form'
import { getGyms } from '@/lib/actions/gyms'

export const metadata = {
  title: 'Create QR Code - Inkuity',
  description: 'Generate a new QR code',
}

export default async function CreateQRCodePage() {
  const { data: gyms } = await getGyms()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create QR Code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a new QR code for check-ins, equipment, or promotions.
        </p>
      </div>

      <div className="max-w-2xl">
        <CreateQRCodeForm gyms={gyms} />
      </div>
    </div>
  )
}
