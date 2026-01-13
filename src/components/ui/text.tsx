import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { classHelper } from "@/lib/utils/class-helper";

const textVariants = cva("", {
  variants: {
    variant: {
      base: "leading-7 [&:not(:first-child)]:mt-6",
      blockquote: "mt-6 border-l-2 pl-6 italic",
      code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      lead: "text-xl text-muted-foreground",
      muted: "text-sm text-muted-foreground",
      small: "text-sm font-medium leading-none",
      large: "text-lg font-semibold",
    },
  },
  defaultVariants: {
    variant: "base",
  },
});

type TextProps = { asChild?: boolean } & React.ComponentProps<"p"> &
  VariantProps<typeof textVariants>;

function Text({ asChild = false, variant = "base", className, ...rest }: TextProps) {
  const Comp = asChild ? Slot : "p";

  return (
    <Comp
      data-slot={variant}
      className={classHelper(textVariants({ variant }), className)}
      {...rest}
    />
  );
}

export { Text, textVariants };
