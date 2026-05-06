import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-input relative row-span-1 flex flex-col justify-between space-y-4 overflow-hidden rounded-[8px] border border-border bg-white/92 p-4 shadow-sm shadow-black/[0.03] transition duration-200 hover:-translate-y-0.5 hover:border-[#0f6b7a]/30 hover:shadow-xl hover:shadow-black/[0.08] dark:border-white/[0.2] dark:bg-black dark:shadow-none",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block rounded-[8px] bg-[#edf7f8] opacity-0 transition-opacity duration-150 group-hover/bento:opacity-100 dark:bg-[#1e293b]/80"
      />
      <div className="relative z-20">{header}</div>
      <div className="relative z-20 transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-2 mb-2 font-sans font-bold text-foreground">
          {title}
        </div>
        <div className="font-sans text-xs font-normal leading-relaxed text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  );
};
