"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Loader2, Mail, Shield, Trash2, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  approveAppUser,
  inviteAppUser,
  removeAppUser,
  type AppUserListItem,
} from "@/app/actions/users";

import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function statusBadge(status: AppUserListItem["status"]) {
  if (status === "pending") return <Badge variant="outline">Pending</Badge>;
  if (status === "active") return <Badge variant="gradient">Active</Badge>;
  return <Badge variant="secondary">Disabled</Badge>;
}

function UserRow({
  user,
  onChanged,
}: {
  user: AppUserListItem;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveAppUser(user.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("User approved.");
      onChanged();
    });
  };

  const handleRemove = () => {
    const label = user.displayName || user.email;
    if (
      !window.confirm(
        `Remove ${label}? They will lose sign-in access and must be invited again.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await removeAppUser(user.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("User removed.");
      onChanged();
    });
  };

  return (
    <li className="flex flex-col gap-3 rounded-2xl glass-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user.displayName || user.email}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {user.email}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {statusBadge(user.status)}
          <Badge variant="outline" className="text-[10px]">
            {user.role === "admin" ? (
              <>
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </>
            ) : (
              "Member"
            )}
          </Badge>
          {!user.hasSignedIn ? (
            <Badge variant="outline" className="text-[10px]">
              Invited
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {user.status === "pending" ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={handleApprove}
            className="gap-1.5"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" />
            )}
            Approve
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={handleRemove}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Remove
        </Button>
      </div>
    </li>
  );
}

function InviteUserDialog({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<"member" | "admin">("member");

  const handleSubmit = (formData: FormData) => {
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      const res = await inviteAppUser({ email, role });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Invitation sent.");
      setOpen(false);
      onInvited();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Invite user</DialogTitle>
        <DialogDescription>
          Sends a Clerk invitation and grants workspace access when they sign
          in. Any email address is allowed for invites.
        </DialogDescription>
        <form action={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="name@company.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "admin")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={pending} className="w-full gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Send invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManagement({ users }: { users: AppUserListItem[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const pending = useMemo(
    () => users.filter((u) => u.status === "pending"),
    [users],
  );
  const active = useMemo(
    () => users.filter((u) => u.status === "active"),
    [users],
  );
  const other = useMemo(
    () => users.filter((u) => u.status === "disabled"),
    [users],
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Approve sign-ups, invite teammates, and remove access. Removals delete the Clerk account and revoke workspace access."
        actions={<InviteUserDialog onInvited={refresh} />}
      />

      {pending.length > 0 ? (
        <section className="mt-10 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            Pending approval
          </h2>
          <GlassCard className="rounded-3xl p-4">
            <ul className="space-y-2">
              {pending.map((user) => (
                <UserRow key={user.id} user={user} onChanged={refresh} />
              ))}
            </ul>
          </GlassCard>
        </section>
      ) : null}

      <section className="mt-10 space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          Active
        </h2>
        <GlassCard className="rounded-3xl p-4">
          {active.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No active users yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {active.map((user) => (
                <UserRow key={user.id} user={user} onChanged={refresh} />
              ))}
            </ul>
          )}
        </GlassCard>
      </section>

      {other.length > 0 ? (
        <section className="mt-10 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            Disabled
          </h2>
          <GlassCard className="rounded-3xl p-4">
            <ul className="space-y-2">
              {other.map((user) => (
                <UserRow key={user.id} user={user} onChanged={refresh} />
              ))}
            </ul>
          </GlassCard>
        </section>
      ) : null}
    </div>
  );
}
