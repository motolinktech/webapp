import { cva, type VariantProps } from "class-variance-authority";
import { classHelper } from "@/lib/utils/class-helper";

const headingVariants = cva("", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
    },
  },
  defaultVariants: {
    variant: "h1",
  },
});

type HeadingProps = React.ComponentProps<"h1" | "h2" | "h3" | "h4"> &
  VariantProps<typeof headingVariants>;

function Heading({ variant, className, ...props }: HeadingProps) {
  const Component = variant ?? "h1";

  return <Component className={classHelper(headingVariants({ variant }), className)} {...props} />;
}

export { Heading, headingVariants };
