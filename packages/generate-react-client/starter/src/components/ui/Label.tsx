import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        required: "text-foreground after:content-['*'] after:ml-1 after:text-destructive",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {
  htmlFor?: string;
  required?: boolean;
  children?: React.ReactNode;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, variant, required, ...props }, ref) => {
  const effectiveVariant = required ? 'required' : variant || 'default';

  return (
    <label
      ref={ref}
      data-slot="label"
      className={cn(labelVariants({ variant: effectiveVariant }), className)}
      {...props}
    />
  );
});
Label.displayName = 'Label';

export { Label, labelVariants };
