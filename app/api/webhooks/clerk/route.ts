import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/constants";
import {
  deleteLibraryProfile,
  syncLibraryProfileFromAppUser,
} from "@/lib/auth/sync-library-profile";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req);
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "user.deleted") {
    const clerkUserId = event.data.id;
    if (!clerkUserId) return NextResponse.json({ ok: true });
    await deleteLibraryProfile(clerkUserId);
    await supabase.from("app_users").delete().eq("clerk_user_id", clerkUserId);
    return NextResponse.json({ ok: true });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const clerkUserId = event.data.id;
    if (!clerkUserId) return NextResponse.json({ ok: true });
    const email =
      event.data.email_addresses?.find(
        (e) => e.id === event.data.primary_email_address_id,
      )?.email_address ?? event.data.email_addresses?.[0]?.email_address;

    if (!email) return NextResponse.json({ ok: true });

    const normalized = normalizeEmail(email);
    const displayName =
      [event.data.first_name, event.data.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || null;

    const { data: byClerk } = await supabase
      .from("app_users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (byClerk) {
      const { data: row } = await supabase
        .from("app_users")
        .select("role")
        .eq("id", byClerk.id)
        .maybeSingle();

      await supabase
        .from("app_users")
        .update({
          email: normalized,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", byClerk.id);

      if (row?.role) {
        await syncLibraryProfileFromAppUser(
          clerkUserId,
          row.role as "admin" | "member",
          displayName,
        );
      }
      return NextResponse.json({ ok: true });
    }

    const { data: byEmail } = await supabase
      .from("app_users")
      .select("id, status, role")
      .ilike("email", normalized)
      .maybeSingle();

    if (byEmail) {
      await supabase
        .from("app_users")
        .update({
          clerk_user_id: clerkUserId,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", byEmail.id);

      await syncLibraryProfileFromAppUser(
        clerkUserId,
        byEmail.role as "admin" | "member",
        displayName,
      );
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ ok: true });
}
