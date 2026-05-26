export default function WorkspaceScreenerStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-screener-editor-root
      className="-mx-5 -my-8 flex min-h-0 flex-1 flex-col overflow-hidden sm:-mx-6 lg:-mx-8"
    >
      {children}
    </div>
  );
}
