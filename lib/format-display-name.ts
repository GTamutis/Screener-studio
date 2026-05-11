import type { User } from "@clerk/backend";

export function formatUserDisplayName(user: User | null) {
  if (!user) return "Signed in";
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (user.username) return user.username;
  const email = user.primaryEmailAddress?.emailAddress;
  if (email) return email;
  return "Signed in";
}
