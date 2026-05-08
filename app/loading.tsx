export default function Loading() {
  return (
    <div className="min-h-full p-6">
      <div className="mx-auto max-w-6xl">
        <div className="soft-skeleton mb-6 h-12 w-64 rounded-[8px] border border-border" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="soft-skeleton h-40 rounded-[8px] border border-border" />
          <div className="soft-skeleton h-40 rounded-[8px] border border-border" />
          <div className="soft-skeleton h-40 rounded-[8px] border border-border" />
        </div>
        <div className="soft-skeleton mt-4 h-72 rounded-[8px] border border-border" />
      </div>
    </div>
  );
}
