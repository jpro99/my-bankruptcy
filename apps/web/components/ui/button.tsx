import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-indigo-600 active:scale-[0.98]",
        secondary:
          "bg-white text-foreground border border-border shadow-sm hover:bg-muted active:scale-[0.98]",
        ghost: "hover:bg-muted text-foreground",
        accent: "bg-accent text-accent-foreground shadow-sm hover:bg-teal-700 active:scale-[0.98]",
        danger: "bg-danger text-white shadow-sm hover:bg-red-700 active:scale-[0.98]",
        success: "bg-success text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
        outline:
          "bg-white text-foreground border border-border shadow-sm hover:bg-muted active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
