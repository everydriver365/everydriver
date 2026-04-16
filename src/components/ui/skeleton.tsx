import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "before:animate-[shimmer_1.5s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
