import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { DosLandingPage } from "@/components/marketing/dos-landing";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/workspace");
  }

  return <DosLandingPage />;
}
