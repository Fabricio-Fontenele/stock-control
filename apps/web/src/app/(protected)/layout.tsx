import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth/guards";

export default async function ProtectedLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  return <AppShell user={session.user}>{children}</AppShell>;
}
