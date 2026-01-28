import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-gradient-to-r hover:from-[#00f5ff] hover:to-[#7b2cff] hover:text-white hover:shadow-[0_0_12px_rgba(0,245,255,0.6)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:text-white hover:shadow-[0_0_12px_rgba(255,0,100,0.6)]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-gradient-to-r hover:from-[#00f5ff]/10 hover:to-[#7b2cff]/10 hover:border-[#00f5ff]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-gradient-to-r hover:from-slate-600 hover:to-slate-700 hover:text-white",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:scale-100",
        white:
          "bg-white text-black font-semibold border border-slate-200 shadow-sm hover:bg-gradient-to-r hover:from-[#00f5ff] hover:to-[#7b2cff] hover:text-white hover:shadow-[0_0_12px_rgba(0,245,255,0.6)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className = "", variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  
  // CRITICAL: Automatic safety override for white background buttons
  const hasWhiteBg = /\bbg-white\b/.test(className);
  const hasGrayBg = /\bbg-gray-(50|100)\b/.test(className);
  const hasSlateBg = /\bbg-slate-(50|100)\b/.test(className);
  const hasLightBg = hasWhiteBg || hasGrayBg || hasSlateBg;
  
  const hasTextClass = /\btext-[\w-]+\b/.test(className);
  
  // If light background detected without explicit text class → force black text
  const autoTextFix = hasLightBg && !hasTextClass ? "!text-black !font-semibold" : "";
  
  // Build final className with proper override order
  const finalClassName = cn(
    buttonVariants({ variant, size }), 
    className,
    autoTextFix
  );
  
  return (
    <Comp
      className={finalClassName}
      ref={ref}
      {...props} 
    />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }