"use client";

import { usePathname } from "next/navigation";

import { MeshBackground } from "@/components/ui/glass/mesh-background";

export function ConditionalMesh() {
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }
  return <MeshBackground />;
}
