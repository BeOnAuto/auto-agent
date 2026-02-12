import type { Meta, StoryObj } from '@storybook/react-vite';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/HoverCard';
import { CalendarDaysIcon } from 'lucide-react';

const meta: Meta<typeof HoverCard> = {
  title: 'HoverCard',
  component: HoverCard,
};
export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#" className="text-sm font-medium underline underline-offset-4">
          @nextjs
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">The React Framework for the Web. Created and maintained by @vercel.</p>
            <div className="flex items-center pt-2">
              <CalendarDaysIcon className="text-muted-foreground mr-2 h-4 w-4" />
              <span className="text-muted-foreground text-xs">Joined December 2021</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Simple: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="cursor-pointer text-sm font-medium underline underline-offset-4">Hover me</span>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm">This is a simple hover card with some text content.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};
