import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from '@/components/ui/Calendar';

const meta: Meta<typeof Calendar> = {
  title: 'Calendar',
  component: Calendar,
};
export default meta;
type Story = StoryObj<typeof Calendar>;

function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />;
}

export const Default: Story = {
  render: () => <CalendarDemo />,
};

function CalendarRangeDemo() {
  const [range, setRange] = useState<{ from: Date; to?: Date } | undefined>({
    from: new Date(),
  });
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange as (value: unknown) => void}
      numberOfMonths={2}
      className="rounded-md border"
    />
  );
}

export const RangeSelection: Story = {
  render: () => <CalendarRangeDemo />,
};
