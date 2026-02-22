'use client'

import { useState } from 'react'
import { Announcement } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  AlertTriangle,
  AlertCircle,
  PartyPopper,
  DoorClosed,
  Info,
  Bell,
} from 'lucide-react'
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/lib/actions/announcements'
import { toast } from 'sonner'

interface AnnouncementsManagerProps {
  announcements: Announcement[]
  gymId: string
}

const TYPE_CONFIG: Record<
  Announcement['type'],
  { label: string; color: string; icon: typeof Info }
> = {
  info: {
    label: 'Info',
    color: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    icon: Info,
  },
  warning: {
    label: 'Warning',
    color: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    icon: AlertTriangle,
  },
  emergency: {
    label: 'Emergency',
    color: 'bg-red-500/10 text-red-400 ring-red-500/20',
    icon: AlertCircle,
  },
  holiday: {
    label: 'Holiday',
    color: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
    icon: PartyPopper,
  },
  closure: {
    label: 'Closure',
    color: 'bg-gray-500/10 text-gray-400 ring-gray-500/20',
    icon: DoorClosed,
  },
}

const TYPE_OPTIONS: { value: Announcement['type']; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'closure', label: 'Closure' },
]

type FormState = {
  title: string
  message: string
  type: Announcement['type']
  starts_at: string
  ends_at: string
  notify_members: boolean
}

const defaultForm: FormState = {
  title: '',
  message: '',
  type: 'info',
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: '',
  notify_members: false,
}

export function AnnouncementsManager({
  announcements: initialAnnouncements,
  gymId,
}: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...defaultForm,
      starts_at: new Date().toISOString().slice(0, 16),
    })
    setShowForm(true)
  }

  const openEdit = (a: Announcement) => {
    setEditingId(a.id)
    setForm({
      title: a.title,
      message: a.message,
      type: a.type,
      starts_at: a.starts_at ? a.starts_at.slice(0, 16) : '',
      ends_at: a.ends_at ? a.ends_at.slice(0, 16) : '',
      notify_members: a.notify_members,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(defaultForm)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const result = await updateAnnouncement(editingId, {
          title: form.title,
          message: form.message,
          type: form.type,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
          notify_members: form.notify_members,
        })
        if (!result.success) throw new Error(result.error)
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingId ? result.data! : a))
        )
        toast.success('Announcement updated')
      } else {
        const result = await createAnnouncement({
          gym_id: gymId,
          title: form.title,
          message: form.message,
          type: form.type,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
          notify_members: form.notify_members,
        })
        if (!result.success) throw new Error(result.error)
        setAnnouncements((prev) => [result.data!, ...prev])
        toast.success('Announcement created')
      }
      closeForm()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialogId) return
    setDeleting(true)
    try {
      const result = await deleteAnnouncement(deleteDialogId)
      if (!result.success) throw new Error(result.error)
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteDialogId))
      toast.success('Announcement deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete announcement')
    } finally {
      setDeleting(false)
      setDeleteDialogId(null)
    }
  }

  const handleToggleActive = async (a: Announcement) => {
    try {
      const result = await updateAnnouncement(a.id, {
        is_active: !a.is_active,
      })
      if (!result.success) throw new Error(result.error)
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === a.id ? result.data! : item))
      )
      toast.success(result.data!.is_active ? 'Announcement activated' : 'Announcement deactivated')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update announcement')
    }
  }

  const now = new Date()

  const isCurrentlyActive = (a: Announcement) => {
    if (!a.is_active) return false
    const start = new Date(a.starts_at)
    if (start > now) return false
    if (a.ends_at && new Date(a.ends_at) < now) return false
    return true
  }

  const activeAnnouncements = announcements.filter(isCurrentlyActive)
  const otherAnnouncements = announcements.filter((a) => !isCurrentlyActive(a))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan-500/10">
            <Megaphone className="h-5 w-5 text-brand-cyan-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {activeAnnouncements.length} active announcement{activeAnnouncements.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {/* Active Announcements */}
      {activeAnnouncements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Active Now
          </h3>
          {activeAnnouncements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              isActive
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleteDialogId(a.id)}
              onToggleActive={() => handleToggleActive(a)}
            />
          ))}
        </div>
      )}

      {/* Other Announcements */}
      {otherAnnouncements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {activeAnnouncements.length > 0 ? 'Past & Scheduled' : 'All Announcements'}
          </h3>
          {otherAnnouncements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              isActive={false}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleteDialogId(a.id)}
              onToggleActive={() => handleToggleActive(a)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {announcements.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <Megaphone className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No announcements yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create announcements to keep your members informed about holidays, closures, and important updates.
            </p>
            <Button onClick={openCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create First Announcement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the announcement details below.'
                : 'Fill in the details to create a new announcement for your members.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                placeholder="e.g. Holiday Closure Notice"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="ann-message">Message</Label>
              <textarea
                id="ann-message"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Write the announcement message..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="ann-type">Type</Label>
              <select
                id="ann-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as Announcement['type'],
                  }))
                }
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ann-start">Start Date</Label>
                <Input
                  id="ann-start"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, starts_at: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-end">End Date (optional)</Label>
                <Input
                  id="ann-end"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ends_at: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Notify Members */}
            <div className="flex items-center gap-3">
              <input
                id="ann-notify"
                type="checkbox"
                className="h-4 w-4 rounded border-input text-brand-cyan-500 focus:ring-brand-cyan-500"
                checked={form.notify_members}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notify_members: e.target.checked }))
                }
              />
              <Label htmlFor="ann-notify" className="cursor-pointer flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notify members
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Announcement'
                  : 'Create Announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialogId}
        onOpenChange={(open) => !open && setDeleteDialogId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── Announcement Card ────────────────────────────────────────────── */

function AnnouncementCard({
  announcement: a,
  isActive,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  announcement: Announcement
  isActive: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  const config = TYPE_CONFIG[a.type]
  const Icon = config.icon

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card
      className={`transition-all duration-200 ${
        isActive
          ? 'ring-1 ring-brand-cyan-500/20 shadow-sm'
          : 'opacity-75 hover:opacity-100'
      }`}
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold truncate">{a.title}</h4>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ring-1 ring-inset ${config.color}`}
                >
                  {config.label}
                </Badge>
                {a.is_active ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground ring-1 ring-inset ring-border"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {a.message}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>From {formatDate(a.starts_at)}</span>
                {a.ends_at && <span>to {formatDate(a.ends_at)}</span>}
                {a.notify_members && (
                  <span className="flex items-center gap-1 text-brand-cyan-400">
                    <Bell className="h-3 w-3" />
                    Notified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={onToggleActive}
              title={a.is_active ? 'Deactivate' : 'Activate'}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  a.is_active ? 'bg-green-400' : 'bg-muted-foreground'
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
