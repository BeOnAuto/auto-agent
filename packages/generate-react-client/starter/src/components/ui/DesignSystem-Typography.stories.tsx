import type { Meta, StoryObj } from '@storybook/react-vite';

interface TypographyRowProps {
  label: string;
  className: string;
  sample?: string;
}

function TypographyRow({ label, className, sample }: TypographyRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-4">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-mono text-muted-foreground min-w-[120px] shrink-0">{label}</span>
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{className}</code>
      </div>
      <div className={className}>{sample ?? 'The quick brown fox jumps over the lazy dog'}</div>
    </div>
  );
}

function TypographyScale() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-1 pb-4">
        <h2 className="text-2xl font-semibold">Typography Scale</h2>
        <p className="text-sm text-muted-foreground">
          Visual reference for typography classes used throughout the design system.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">Headings</h3>
        <TypographyRow label="H1" className="text-5xl font-extrabold tracking-tight" sample="Display Heading" />
        <TypographyRow label="H2" className="text-4xl font-bold tracking-tight" sample="Page Heading" />
        <TypographyRow label="H3" className="text-3xl font-bold" sample="Section Heading" />
        <TypographyRow label="H4" className="text-2xl font-semibold" sample="Subsection Heading" />
        <TypographyRow label="H5" className="text-xl font-semibold" sample="Card Heading" />
      </div>

      <div className="flex flex-col gap-6 mt-4">
        <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">Body</h3>
        <TypographyRow
          label="Body (lead)"
          className="text-base leading-relaxed"
          sample="Body text with relaxed leading for longer paragraphs. This style improves readability for multi-line content blocks."
        />
        <TypographyRow
          label="Body"
          className="text-base"
          sample="Default body text used for general content and UI labels."
        />
      </div>

      <div className="flex flex-col gap-6 mt-4">
        <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">Muted &amp; Small</h3>
        <TypographyRow
          label="Muted"
          className="text-sm text-muted-foreground"
          sample="Secondary text for descriptions, help text, and supplementary information."
        />
        <TypographyRow
          label="Small / Caption"
          className="text-xs text-muted-foreground"
          sample="Captions, timestamps, and fine-print details."
        />
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Design System/Typography',
};
export default meta;
type Story = StoryObj;

export const TypeScale: Story = {
  render: () => <TypographyScale />,
};
