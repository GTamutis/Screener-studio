export default function StakeholderReviewPopupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-stakeholder-review-shell
      data-stakeholder-review-popup
      className="min-h-screen bg-[hsl(var(--workspace-surface))]"
    >
      <div className="mx-auto w-full max-w-[1400px] min-w-0 px-4 py-5 sm:px-6 sm:py-6">
        {children}
      </div>
    </div>
  );
}
