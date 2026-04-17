export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center dark:bg-card">
      <p className="text-[22px] font-semibold text-jazz-dark dark:text-white">{title}</p>
      <p className="mt-2 text-[17px] text-muted-foreground">{description}</p>
    </div>
  );
}
