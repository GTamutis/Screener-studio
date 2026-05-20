export default function WorkspaceScreenerStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-0 flex min-h-[100dvh] flex-col overflow-hidden">
      {children}
    </div>
  );
}
