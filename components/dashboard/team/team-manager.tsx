'use client'

import { useState } from 'react'
import { GymRole, Gym } from '@/types/database'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  Mail,
  Check,
  X,
  Users,
  Eye,
  Crown,
} from 'lucide-react'
import { inviteUser, updateRole, removeRole } from '@/lib/actions/gym-roles'
import { toast } from 'sonner'

// ============================================================
// TYPES
// ============================================================

type RoleWithProfile = GymRole & {
  profile?: { full_name: string | null; email: string }
}

interface TeamManagerProps {
  roles: RoleWithProfile[]
  gym: Gym | null
}

type RoleType = 'co_owner' | 'trainer' | 'receptionist' | 'viewer'

// ============================================================
// CONSTANTS
// ============================================================

const ALL_PERMISSIONS = [
  { key: 'manage_members', label: 'Manage Members' },
  { key: 'view_payments', label: 'View Payments' },
  { key: 'record_payments', label: 'Record Payments' },
  { key: 'manage_qr_codes', label: 'Manage QR Codes' },
  { key: 'view_analytics', label: 'View Analytics' },
  { key: 'manage_announcements', label: 'Manage Announcements' },
  { key: 'manage_staff', label: 'Manage Staff & Expenses' },
] as const

const ROLE_DEFAULTS: Record<RoleType, Record<string, boolean>> = {
  co_owner: {
    manage_members: true,
    view_payments: true,
    record_payments: true,
    manage_qr_codes: true,
    view_analytics: true,
    manage_announcements: true,
    manage_staff: true,
  },
  trainer: {
    manage_members: true,
    view_payments: false,
    record_payments: false,
    manage_qr_codes: false,
    view_analytics: true,
    manage_announcements: false,
    manage_staff: false,
  },
  receptionist: {
    manage_members: true,
    view_payments: false,
    record_payments: true,
    manage_qr_codes: false,
    view_analytics: false,
    manage_announcements: false,
    manage_staff: false,
  },
  viewer: {
    manage_members: false,
    view_payments: true,
    record_payments: false,
    manage_qr_codes: false,
    view_analytics: true,
    manage_announcements: false,
    manage_staff: false,
  },
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  co_owner: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  trainer: 'bg-green-500/15 text-green-400 border-green-500/30',
  receptionist: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  viewer: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  co_owner: 'Co-Owner',
  trainer: 'Trainer',
  receptionist: 'Receptionist',
  viewer: 'Viewer',
}

// ============================================================
// COMPONENT
// ============================================================

export function TeamManager({ roles: initialRoles, gym }: TeamManagerProps) {
  const [roles, setRoles] = useState<RoleWithProfile[]>(initialRoles)
  const [loading, setLoading] = useState(false)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<RoleType>('trainer')
  const [invitePermissions, setInvitePermissions] = useState<Record<string, boolean>>(
    ROLE_DEFAULTS.trainer
  )

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleWithProfile | null>(null)
  const [editRoleType, setEditRoleType] = useState<RoleType>('trainer')
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({})

  // Remove confirmation dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removingRole, setRemovingRole] = useState<RoleWithProfile | null>(null)

  if (!gym) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No gym found. Create a gym first to manage your team.
        </CardContent>
      </Card>
    )
  }

  // ---- Invite Role Change Handler ----
  function handleInviteRoleChange(role: RoleType) {
    setInviteRole(role)
    setInvitePermissions({ ...ROLE_DEFAULTS[role] })
  }

  // ---- Invite Permission Toggle ----
  function toggleInvitePermission(key: string) {
    if (inviteRole === 'co_owner') return
    setInvitePermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // ---- Send Invite ----
  async function handleInvite() {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address.')
      return
    }
    setLoading(true)
    try {
      const result = await inviteUser(gym!.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
        permissions: invitePermissions,
      })
      if (result.success) {
        toast.success('Invite sent successfully!')
        setInviteEmail('')
        setInviteRole('trainer')
        setInvitePermissions({ ...ROLE_DEFAULTS.trainer })
        // Refresh roles list - add the new role with a placeholder profile
        if (result.data) {
          setRoles((prev) => [
            { ...result.data!, profile: { full_name: null, email: inviteEmail.trim() } },
            ...prev,
          ])
        }
      } else {
        toast.error(result.error || 'Failed to send invite.')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Open Edit Dialog ----
  function openEditDialog(role: RoleWithProfile) {
    setEditingRole(role)
    setEditRoleType(role.role === 'owner' ? 'co_owner' : (role.role as RoleType))
    setEditPermissions(
      role.role === 'owner'
        ? { ...ROLE_DEFAULTS.co_owner }
        : { ...ROLE_DEFAULTS[role.role as RoleType], ...role.permissions }
    )
    setEditDialogOpen(true)
  }

  // ---- Edit Role Change Handler ----
  function handleEditRoleChange(role: RoleType) {
    setEditRoleType(role)
    setEditPermissions({ ...ROLE_DEFAULTS[role] })
  }

  // ---- Toggle Edit Permission ----
  function toggleEditPermission(key: string) {
    if (editRoleType === 'co_owner') return
    setEditPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // ---- Save Edit ----
  async function handleSaveEdit() {
    if (!editingRole) return
    setLoading(true)
    try {
      const result = await updateRole(editingRole.id, {
        role: editRoleType,
        permissions: editPermissions,
      })
      if (result.success) {
        toast.success('Role updated successfully!')
        setRoles((prev) =>
          prev.map((r) =>
            r.id === editingRole.id
              ? { ...r, role: editRoleType, permissions: editPermissions }
              : r
          )
        )
        setEditDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to update role.')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Remove Role ----
  async function handleRemove() {
    if (!removingRole) return
    setLoading(true)
    try {
      const result = await removeRole(removingRole.id)
      if (result.success) {
        toast.success('Team member removed.')
        setRoles((prev) => prev.filter((r) => r.id !== removingRole.id))
        setRemoveDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to remove team member.')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Permission Summary Helper ----
  function getPermissionSummary(perms: Record<string, boolean>) {
    const active = ALL_PERMISSIONS.filter((p) => perms[p.key])
    if (active.length === ALL_PERMISSIONS.length) return 'All permissions'
    if (active.length === 0) return 'No permissions'
    return active.map((p) => p.label).join(', ')
  }

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* CURRENT TEAM MEMBERS */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Current Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No team members yet. Invite someone below to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => {
                const isOwner = role.role === 'owner'
                const displayName =
                  role.profile?.full_name || role.profile?.email || 'Unknown User'
                const displayEmail = role.profile?.email || ''

                return (
                  <div
                    key={role.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">
                          {displayName}
                        </span>
                        <Badge
                          className={`${ROLE_COLORS[role.role]} border text-xs`}
                        >
                          {isOwner && <Crown className="h-3 w-3 mr-1" />}
                          {ROLE_LABELS[role.role]}
                        </Badge>
                        <Badge
                          variant={role.is_active ? 'default' : 'secondary'}
                          className={
                            role.is_active
                              ? 'bg-green-500/15 text-green-400 border border-green-500/30 text-xs'
                              : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs'
                          }
                        >
                          {role.is_active ? 'Active' : 'Invited'}
                        </Badge>
                      </div>
                      {displayEmail && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {displayEmail}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {isOwner
                          ? 'All permissions'
                          : getPermissionSummary(role.permissions || {})}
                      </p>
                    </div>

                    {!isOwner && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setRemovingRole(role)
                            setRemoveDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* INVITE USER FORM */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => handleInviteRoleChange(v as RoleType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="co_owner">Co-Owner</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permissions checkboxes */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_PERMISSIONS.map((perm) => {
                const isChecked = invitePermissions[perm.key] ?? false
                const isDisabled = inviteRole === 'co_owner'
                return (
                  <label
                    key={perm.key}
                    className={`flex items-center gap-2 rounded-md border border-border p-2.5 text-sm transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-brand-cyan-500/5 border-brand-cyan-500/30'
                        : 'hover:bg-muted/50'
                    } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => toggleInvitePermission(perm.key)}
                      className="h-4 w-4 rounded border-input accent-brand-cyan-500"
                    />
                    <span className="text-foreground">{perm.label}</span>
                  </label>
                )
              })}
            </div>
            {inviteRole === 'co_owner' && (
              <p className="text-xs text-muted-foreground">
                Co-Owners automatically receive all permissions.
              </p>
            )}
          </div>

          <Button onClick={handleInvite} disabled={loading}>
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send Invite'}
          </Button>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* PERMISSIONS SUMMARY */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Role Permissions Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Permission
                  </th>
                  {(['co_owner', 'trainer', 'receptionist', 'viewer'] as const).map(
                    (role) => (
                      <th
                        key={role}
                        className="text-center py-2 px-3 font-medium text-muted-foreground"
                      >
                        <Badge className={`${ROLE_COLORS[role]} border text-xs`}>
                          {ROLE_LABELS[role]}
                        </Badge>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((perm) => (
                  <tr key={perm.key} className="border-b border-border/50">
                    <td className="py-2.5 pr-4 text-foreground">{perm.label}</td>
                    {(['co_owner', 'trainer', 'receptionist', 'viewer'] as const).map(
                      (role) => (
                        <td key={role} className="text-center py-2.5 px-3">
                          {ROLE_DEFAULTS[role][perm.key] ? (
                            <Check className="h-4 w-4 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          )}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* EDIT ROLE DIALOG */}
      {/* ============================================================ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the role and permissions for{' '}
              {editingRole?.profile?.full_name || editingRole?.profile?.email || 'this user'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editRoleType}
                onValueChange={(v) => handleEditRoleChange(v as RoleType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="co_owner">Co-Owner</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid gap-2">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = editPermissions[perm.key] ?? false
                  const isDisabled = editRoleType === 'co_owner'
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-center gap-2 rounded-md border border-border p-2.5 text-sm transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-brand-cyan-500/5 border-brand-cyan-500/30'
                          : 'hover:bg-muted/50'
                      } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => toggleEditPermission(perm.key)}
                        className="h-4 w-4 rounded border-input accent-brand-cyan-500"
                      />
                      <span className="text-foreground">{perm.label}</span>
                    </label>
                  )
                })}
              </div>
              {editRoleType === 'co_owner' && (
                <p className="text-xs text-muted-foreground">
                  Co-Owners automatically receive all permissions.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* REMOVE CONFIRMATION DIALOG */}
      {/* ============================================================ */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-medium text-foreground">
                {removingRole?.profile?.full_name || removingRole?.profile?.email || 'this user'}
              </span>{' '}
              from the team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={loading}>
              {loading ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
