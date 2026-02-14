import type { Meta, StoryObj } from '@storybook/react-vite';

interface ColorToken {
  variable: string;
  utility: string;
}

interface ColorGroup {
  label: string;
  tokens: ColorToken[];
}

const colorGroups: ColorGroup[] = [
  {
    label: 'Core',
    tokens: [
      { variable: '--primary', utility: 'bg-primary' },
      { variable: '--primary-foreground', utility: 'bg-primary-foreground' },
      { variable: '--secondary', utility: 'bg-secondary' },
      { variable: '--secondary-foreground', utility: 'bg-secondary-foreground' },
      { variable: '--accent', utility: 'bg-accent' },
      { variable: '--accent-foreground', utility: 'bg-accent-foreground' },
      { variable: '--muted', utility: 'bg-muted' },
      { variable: '--muted-foreground', utility: 'bg-muted-foreground' },
      { variable: '--destructive', utility: 'bg-destructive' },
      { variable: '--destructive-foreground', utility: 'bg-destructive-foreground' },
      { variable: '--background', utility: 'bg-background' },
      { variable: '--foreground', utility: 'bg-foreground' },
    ],
  },
  {
    label: 'Surface',
    tokens: [
      { variable: '--card', utility: 'bg-card' },
      { variable: '--card-foreground', utility: 'bg-card-foreground' },
      { variable: '--popover', utility: 'bg-popover' },
      { variable: '--popover-foreground', utility: 'bg-popover-foreground' },
    ],
  },
  {
    label: 'UI',
    tokens: [
      { variable: '--border', utility: 'bg-border' },
      { variable: '--input', utility: 'bg-input' },
      { variable: '--ring', utility: 'bg-ring' },
    ],
  },
  {
    label: 'Charts',
    tokens: [
      { variable: '--chart-1', utility: 'bg-chart-1' },
      { variable: '--chart-2', utility: 'bg-chart-2' },
      { variable: '--chart-3', utility: 'bg-chart-3' },
      { variable: '--chart-4', utility: 'bg-chart-4' },
      { variable: '--chart-5', utility: 'bg-chart-5' },
    ],
  },
  {
    label: 'Sidebar',
    tokens: [
      { variable: '--sidebar', utility: 'bg-sidebar' },
      { variable: '--sidebar-foreground', utility: 'bg-sidebar-foreground' },
      { variable: '--sidebar-primary', utility: 'bg-sidebar-primary' },
      {
        variable: '--sidebar-primary-foreground',
        utility: 'bg-sidebar-primary-foreground',
      },
      { variable: '--sidebar-accent', utility: 'bg-sidebar-accent' },
      {
        variable: '--sidebar-accent-foreground',
        utility: 'bg-sidebar-accent-foreground',
      },
      { variable: '--sidebar-border', utility: 'bg-sidebar-border' },
      { variable: '--sidebar-ring', utility: 'bg-sidebar-ring' },
    ],
  },
];

function ColorSwatch({ variable, utility }: ColorToken) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="h-16 w-16 rounded-md border border-border" style={{ backgroundColor: `var(${variable})` }} />
      <span className="text-xs font-mono text-foreground">{variable}</span>
      <span className="text-xs font-mono text-muted-foreground">{utility}</span>
    </div>
  );
}

function ColorSwatches() {
  return (
    <div className="flex flex-col gap-10 p-6">
      {colorGroups.map((group) => (
        <section key={group.label}>
          <h2 className="mb-4 text-lg font-semibold text-foreground">{group.label}</h2>
          <div className="flex flex-wrap gap-6">
            {group.tokens.map((token) => (
              <ColorSwatch key={token.variable} {...token} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: 'Design System/Colors',
  component: ColorSwatches,
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <ColorSwatches />,
};
