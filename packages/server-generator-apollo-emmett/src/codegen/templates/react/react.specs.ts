import type { Model as SpecsSchema } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import { generateScaffoldFilePlans } from '../../scaffoldFromSchema';

describe('handle.ts.ejs (react slice)', () => {
  it('should generate correct react.ts', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'manage bookings',
          slices: [
            {
              type: 'command',
              name: 'guest submits booking request',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Guest submits booking request command',
                    rules: [
                      {
                        name: 'Should handle booking request successfully',
                        examples: [
                          {
                            name: 'User submits booking request successfully',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'RequestBooking',
                                docString: {
                                  propertyId: 'listing_123',
                                  hostId: 'host_123',
                                  guestId: 'guest_456',
                                  checkIn: '2025-07-15',
                                  checkOut: '2025-07-18',
                                  guests: 2,
                                  message: 'Looking forward to my stay!',
                                  metadata: { now: 'bar', bookingId: '123' },
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'BookingRequested',
                                docString: {
                                  bookingId: 'book_xyz789',
                                  hostId: 'host_123',
                                  propertyId: 'prop_789',
                                  guestId: 'guest_456',
                                  checkIn: '2025-07-15',
                                  checkOut: '2025-07-18',
                                  guests: 2,
                                  message: 'Hey',
                                  status: 'pending_host_approval',
                                  requestedAt: '2025-06-10T16:30:00.000Z',
                                  expiresAt: '2025-06-11T16:30:00.000Z',
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
            {
              type: 'react',
              name: 'Send notification to host',
              server: {
                description: 'Sends a host notification command in response to BookingRequested',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Send notification to host reaction',
                    rules: [
                      {
                        name: 'Should send host notification on booking request',
                        examples: [
                          {
                            name: 'Booking request triggers host notification',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'BookingRequested',
                                docString: {
                                  bookingId: 'book_xyz789',
                                  hostId: 'host_123',
                                  propertyId: 'prop_789',
                                  guestId: 'guest_456',
                                  checkIn: '2025-07-15',
                                  checkOut: '2025-07-18',
                                  guests: 2,
                                  message: 'Hey',
                                  status: 'pending_host_approval',
                                  requestedAt: '2025-06-10T16:30:00.000Z',
                                  expiresAt: '2025-06-11T16:30:00.000Z',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'NotifyHost',
                                docString: {
                                  hostId: 'host_123',
                                  notificationType: 'booking_request',
                                  priority: 'high',
                                  channels: ['email', 'push'],
                                  message: 'A guest has requested to book your place.',
                                  actionRequired: true,
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
            {
              type: 'command',
              name: 'notify host',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Notify host command',
                    rules: [
                      {
                        name: 'Should notify host successfully',
                        examples: [
                          {
                            name: 'Host notification sent successfully',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'NotifyHost',
                                docString: {
                                  hostId: 'host_123',
                                  notificationType: 'booking_request',
                                  priority: 'high',
                                  channels: ['email', 'push'],
                                  message: 'A guest has requested to book your place.',
                                  actionRequired: true,
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'HostNotified',
                                docString: {
                                  bookingId: 'book_xyz789',
                                  hostId: 'host_123',
                                  notificationType: 'booking_request',
                                  channels: ['email', 'push'],
                                  message: 'hi.',
                                  notifiedAt: '2025-06-10T16:30:00.000Z',
                                  actionRequired: true,
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
      modules: [],
      messages: [
        {
          type: 'command',
          name: 'RequestBooking',
          fields: [
            { name: 'propertyId', type: 'string', required: true },
            { name: 'hostId', type: 'string', required: true },
            { name: 'guestId', type: 'string', required: true },
            { name: 'checkIn', type: 'date', required: true },
            { name: 'checkOut', type: 'date', required: true },
            { name: 'guests', type: 'number', required: true },
            { name: 'message', type: 'string', required: false },
          ],
        },
        {
          type: 'command',
          name: 'NotifyHost',
          fields: [
            { name: 'hostId', type: 'string', required: true },
            { name: 'notificationType', type: 'string', required: true },
            { name: 'priority', type: 'string', required: true },
            { name: 'channels', type: 'string[]', required: true },
            { name: 'message', type: 'string', required: true },
            { name: 'actionRequired', type: 'boolean', required: true },
          ],
        },
        {
          type: 'event',
          name: 'BookingRequested',
          source: 'internal',
          fields: [
            { name: 'bookingId', type: 'string', required: true },
            { name: 'hostId', type: 'string', required: true },
            { name: 'message', type: 'string', required: true },
          ],
        },
        {
          type: 'event',
          name: 'HostNotified',
          source: 'internal',
          fields: [
            { name: 'bookingId', type: 'string', required: true },
            { name: 'hostId', type: 'string', required: true },
            { name: 'notificationType', type: 'string', required: true },
            { name: 'channels', type: 'string[]', required: true },
            { name: 'notifiedAt', type: 'date', required: true },
            { name: 'actionRequired', type: 'boolean', required: true },
            { name: 'message', type: 'string', required: true },
          ],
        },
      ],
    };

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const handleFile = plans.find((p) => p.outputPath.endsWith('react.ts'));

    expect(handleFile?.contents).toMatchInlineSnapshot(`
      "import { inMemoryReactor, type MessageHandlerResult, IllegalStateError } from '@event-driven-io/emmett';
      import type { BookingRequested } from '../guest-submits-booking-request/events';
      import type { ReactorContext } from '../../../shared';

      export const react = ({ eventStore, commandSender, database }: ReactorContext) =>
        inMemoryReactor<BookingRequested>({
          processorId: 'manage-bookings-send-notification-to-host',
          canHandle: ['BookingRequested'],
          connectionOptions: {
            database,
          },
          eachMessage: async (event, context): Promise<MessageHandlerResult> => {
            /**
             * ## IMPLEMENTATION INSTRUCTIONS ##
             *
             * - Inspect event data to determine if the command should be sent.
             * - Replace the placeholder logic and \\\`throw\\\` below with real implementation.
             * - Send one or more commands via: commandSender.send({...})
             * - Optionally return a MessageHandlerResult for SKIP or error cases.
             */

            throw new IllegalStateError('Not yet implemented: react in response to BookingRequested');

            // Example:
            // if (event.data.status !== 'expected') {
            //   return {
            //     type: 'SKIP',
            //     reason: 'Condition not met',
            //   };
            // }

            // await commandSender.send({
            //   type: 'NotifyHost',
            //   kind: 'Command',
            //   data: {
            //     // Map event fields to command fields here
            //     // e.g., userId: event.data.userId,
            //   },
            // });

            // return;
          },
        });
      "
    `);
  });

  it('should generate cross-flow import path in react.ts', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'order management',
          slices: [
            {
              type: 'command',
              name: 'create order',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Create order',
                    rules: [
                      {
                        name: 'Create order rule',
                        examples: [
                          {
                            name: 'Order created',
                            steps: [
                              { keyword: 'When', text: 'CreateOrder', docString: { orderId: 'o1' } },
                              { keyword: 'Then', text: 'OrderCreated', docString: { orderId: 'o1' } },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          name: 'fulfillment',
          slices: [
            {
              type: 'react',
              name: 'notify warehouse',
              server: {
                description: 'Reacts to OrderCreated from order management flow',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Notify warehouse',
                    rules: [
                      {
                        name: 'Notify on order',
                        examples: [
                          {
                            name: 'Order triggers warehouse notification',
                            steps: [
                              { keyword: 'When', text: 'OrderCreated', docString: { orderId: 'o1' } },
                              { keyword: 'Then', text: 'NotifyWarehouse', docString: { orderId: 'o1' } },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
      modules: [],
      messages: [
        {
          type: 'command',
          name: 'CreateOrder',
          fields: [{ name: 'orderId', type: 'string', required: true }],
        },
        {
          type: 'command',
          name: 'NotifyWarehouse',
          fields: [{ name: 'orderId', type: 'string', required: true }],
        },
        {
          type: 'event',
          name: 'OrderCreated',
          source: 'internal',
          fields: [{ name: 'orderId', type: 'string', required: true }],
        },
      ],
    };

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const reactFile = plans.find((p) => p.outputPath.endsWith('notify-warehouse/react.ts'));

    expect(reactFile?.contents).toContain("from '../../order-management/create-order/events'");
  });

  it('should not self-reference react slice when trigger event has no known producer', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'notifications',
          slices: [
            {
              type: 'react',
              name: 'notify on external event',
              server: {
                description: 'Reacts to an external event with no known command producer',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Notify on external event',
                    rules: [
                      {
                        name: 'Should notify when external event arrives',
                        examples: [
                          {
                            name: 'External event triggers notification',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'ExternalPaymentReceived',
                                docString: { paymentId: 'pay_001', amount: 100 },
                              },
                              {
                                keyword: 'Then',
                                text: 'SendReceipt',
                                docString: { paymentId: 'pay_001' },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
      modules: [],
      messages: [
        {
          type: 'event',
          name: 'ExternalPaymentReceived',
          source: 'external',
          fields: [
            { name: 'paymentId', type: 'string', required: true },
            { name: 'amount', type: 'number', required: true },
          ],
        },
        {
          type: 'command',
          name: 'SendReceipt',
          fields: [{ name: 'paymentId', type: 'string', required: true }],
        },
      ],
    };

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const reactFile = plans.find((p) => p.outputPath.endsWith('notify-on-external-event/react.ts'));
    const registerFile = plans.find((p) => p.outputPath.endsWith('notify-on-external-event/register.ts'));
    const specsFile = plans.find((p) => p.outputPath.endsWith('notify-on-external-event/react.specs.ts'));

    expect(reactFile?.contents).not.toContain('../notify-on-external-event/');
    expect(registerFile?.contents).not.toContain('../notify-on-external-event/');
    expect(specsFile?.contents).not.toContain('../notify-on-external-event/');
  });

  it('should normalize Pattern B-full: swap trigger from given to when', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'order management',
          slices: [
            {
              type: 'command',
              name: 'process payment',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Process payment',
                    rules: [
                      {
                        name: 'Payment processed',
                        examples: [
                          {
                            name: 'Payment succeeds',
                            steps: [
                              { keyword: 'When', text: 'ProcessPayment', docString: { paymentId: 'p1' } },
                              { keyword: 'Then', text: 'PaymentProcessed', docString: { paymentId: 'p1' } },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          name: 'fulfillment',
          slices: [
            {
              type: 'react',
              name: 'adjust inventory',
              server: {
                description: 'Adjusts inventory when payment is processed',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Adjust inventory reaction',
                    rules: [
                      {
                        name: 'Should adjust inventory on payment',
                        examples: [
                          {
                            name: 'Payment triggers adjustment',
                            steps: [
                              { keyword: 'Given', text: 'PaymentProcessed', docString: { paymentId: 'p1' } },
                              {
                                keyword: 'And',
                                text: 'InventoryReservation',
                                docString: { reservationId: 'r1' },
                              },
                              {
                                keyword: 'When',
                                text: 'ReactToPaymentProcessed',
                                docString: {},
                              },
                              { keyword: 'Then', text: 'AdjustInventory', docString: { sku: 'SKU_A' } },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
      modules: [],
      messages: [
        { type: 'command', name: 'ProcessPayment', fields: [{ name: 'paymentId', type: 'string', required: true }] },
        { type: 'command', name: 'AdjustInventory', fields: [{ name: 'sku', type: 'string', required: true }] },
        {
          type: 'event',
          name: 'PaymentProcessed',
          source: 'internal',
          fields: [{ name: 'paymentId', type: 'string', required: true }],
        },
        {
          type: 'state',
          name: 'InventoryReservation',
          fields: [{ name: 'reservationId', type: 'string', required: true }],
        },
      ],
    };

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const reactFile = plans.find((p) => p.outputPath.endsWith('adjust-inventory/react.ts'));

    expect(reactFile?.contents).toContain('inMemoryReactor<PaymentProcessed>');
    expect(reactFile?.contents).toContain("canHandle: ['PaymentProcessed']");
    expect(reactFile?.contents).toContain("from '../../order-management/process-payment/events'");
    expect(reactFile?.contents).not.toContain('ReactToPaymentProcessed');
    expect(reactFile?.contents).toContain('Context state available: InventoryReservation (readable from database)');
  });
});
