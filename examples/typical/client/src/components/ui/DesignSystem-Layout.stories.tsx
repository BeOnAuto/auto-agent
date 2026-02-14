import type { Meta, StoryObj } from '@storybook/react-vite';

function SpacingScale() {
  const spacingItems = [
    { label: 'Section gaps', classes: 'space-y-16, py-16', demo: 'space-y-16 py-16' },
    { label: 'Content gaps', classes: 'space-y-6, space-y-8', demo: 'space-y-6' },
    { label: 'Element gaps', classes: 'space-y-3, gap-3', demo: 'gap-3' },
    { label: 'Padding', classes: 'p-4, p-6, p-8', demo: '' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Spacing Scale</h2>

      {/* Section gaps */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          Section gaps: <code className="text-xs">space-y-16</code>, <code className="text-xs">py-16</code>
        </h3>
        <div className="space-y-16 rounded-lg border border-border p-4">
          <div className="h-8 rounded bg-primary/20" />
          <div className="h-8 rounded bg-primary/20" />
        </div>
      </div>

      {/* Content gaps */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          Content gaps: <code className="text-xs">space-y-6</code>, <code className="text-xs">space-y-8</code>
        </h3>
        <div className="flex gap-8">
          <div className="flex-1">
            <p className="mb-1 text-xs text-muted-foreground">space-y-6</p>
            <div className="space-y-6 rounded-lg border border-border p-4">
              <div className="h-6 rounded bg-primary/20" />
              <div className="h-6 rounded bg-primary/20" />
              <div className="h-6 rounded bg-primary/20" />
            </div>
          </div>
          <div className="flex-1">
            <p className="mb-1 text-xs text-muted-foreground">space-y-8</p>
            <div className="space-y-8 rounded-lg border border-border p-4">
              <div className="h-6 rounded bg-primary/20" />
              <div className="h-6 rounded bg-primary/20" />
              <div className="h-6 rounded bg-primary/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Element gaps */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          Element gaps: <code className="text-xs">space-y-3</code>, <code className="text-xs">gap-3</code>
        </h3>
        <div className="flex gap-8">
          <div className="flex-1">
            <p className="mb-1 text-xs text-muted-foreground">space-y-3</p>
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="h-4 rounded bg-primary/20" />
              <div className="h-4 rounded bg-primary/20" />
              <div className="h-4 rounded bg-primary/20" />
            </div>
          </div>
          <div className="flex-1">
            <p className="mb-1 text-xs text-muted-foreground">gap-3</p>
            <div className="flex gap-3 rounded-lg border border-border p-4">
              <div className="h-4 flex-1 rounded bg-primary/20" />
              <div className="h-4 flex-1 rounded bg-primary/20" />
              <div className="h-4 flex-1 rounded bg-primary/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Padding */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          Padding: <code className="text-xs">p-4</code>, <code className="text-xs">p-6</code>,{' '}
          <code className="text-xs">p-8</code>
        </h3>
        <div className="flex gap-6">
          {(['p-4', 'p-6', 'p-8'] as const).map((padding) => (
            <div key={padding} className="flex-1">
              <p className="mb-1 text-xs text-muted-foreground">{padding}</p>
              <div className={`${padding} rounded-lg border border-border`}>
                <div className="h-8 rounded bg-primary/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BorderRadiusScale() {
  const radii = [
    { label: 'rounded-sm', variable: '--radius-sm', formula: 'calc(var(--radius) - 4px)' },
    { label: 'rounded-md', variable: '--radius-md', formula: 'calc(var(--radius) - 2px)' },
    { label: 'rounded-lg', variable: '--radius-lg', formula: 'var(--radius)' },
    { label: 'rounded-xl', variable: '--radius-xl', formula: 'calc(var(--radius) + 4px)' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Border Radius</h2>
      <div className="flex flex-wrap gap-6">
        {radii.map(({ label, variable, formula }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className={`flex h-24 w-24 items-center justify-center border border-border bg-primary/10 ${label}`}>
              <span className="text-xs text-muted-foreground">{label.replace('rounded-', '')}</span>
            </div>
            <code className="text-xs">{label}</code>
            <span className="text-xs text-muted-foreground">{formula}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShadowScale() {
  const shadows = ['shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl'] as const;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Shadows</h2>
      <div className="flex flex-wrap gap-8">
        {shadows.map((shadow) => (
          <div key={shadow} className="flex flex-col items-center gap-3">
            <div className={`flex h-24 w-24 items-center justify-center rounded-lg bg-background ${shadow}`}>
              <span className="text-xs text-muted-foreground">
                {shadow === 'shadow' ? 'default' : shadow.replace('shadow-', '')}
              </span>
            </div>
            <code className="text-xs">{shadow}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayoutShowcase() {
  return (
    <div className="space-y-16 p-8">
      <SpacingScale />
      <BorderRadiusScale />
      <ShadowScale />
    </div>
  );
}

const meta: Meta = {
  title: 'Design System/Layout',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <LayoutShowcase />,
};
