import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from 'next-themes';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/Sonner';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Toaster> = {
  title: 'Sonner',
  component: Toaster,
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light">
        <Story />
      </ThemeProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <div>
      <Toaster />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => toast('Event has been created.')}>
          Show Toast
        </Button>
        <Button variant="outline" onClick={() => toast.success('Successfully saved!')}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.error('Something went wrong.')}>
          Error
        </Button>
        <Button variant="outline" onClick={() => toast.warning('Please check your input.')}>
          Warning
        </Button>
        <Button variant="outline" onClick={() => toast.info('Here is some information.')}>
          Info
        </Button>
      </div>
    </div>
  ),
};
