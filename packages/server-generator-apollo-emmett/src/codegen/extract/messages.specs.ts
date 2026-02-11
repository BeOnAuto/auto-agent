import type { Slice } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import type { MessageDefinition } from '../types';
import { extractMessagesFromSpecs } from './messages';

describe('extractMessagesFromSpecs (react slice)', () => {
  it('should extract given events and states, filtering phantom refs', () => {
    const slice: Slice = {
      type: 'react',
      name: 'adjust inventory on payment',
      server: {
        description: 'Reacts to PaymentProcessed by adjusting inventory',
        specs: [
          {
            type: 'gherkin',
            feature: 'Adjust inventory on payment reaction',
            rules: [
              {
                name: 'Should adjust inventory when payment is processed',
                examples: [
                  {
                    name: 'Payment triggers inventory adjustment',
                    steps: [
                      {
                        keyword: 'Given',
                        text: 'PaymentProcessed',
                        docString: { paymentId: 'pay_1', orderId: 'ord_1' },
                      },
                      {
                        keyword: 'And',
                        text: 'InventoryReservation',
                        docString: { reservationId: 'res_1', sku: 'SKU_A' },
                      },
                      {
                        keyword: 'When',
                        text: 'ReactToPaymentProcessed',
                        docString: {},
                      },
                      {
                        keyword: 'Then',
                        text: 'AdjustInventory',
                        docString: { sku: 'SKU_A', quantity: -1 },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const allMessages: MessageDefinition[] = [
      {
        type: 'event',
        name: 'PaymentProcessed',
        fields: [
          { name: 'paymentId', type: 'string', required: true },
          { name: 'orderId', type: 'string', required: true },
        ],
      },
      {
        type: 'state',
        name: 'InventoryReservation',
        fields: [
          { name: 'reservationId', type: 'string', required: true },
          { name: 'sku', type: 'string', required: true },
        ],
      },
      {
        type: 'command',
        name: 'AdjustInventory',
        fields: [
          { name: 'sku', type: 'string', required: true },
          { name: 'quantity', type: 'number', required: true },
        ],
      },
    ];

    const result = extractMessagesFromSpecs(slice, allMessages);

    expect(result.events).toEqual([
      {
        type: 'PaymentProcessed',
        fields: [
          { name: 'paymentId', tsType: 'string', required: true },
          { name: 'orderId', tsType: 'string', required: true },
        ],
        source: 'given',
        sourceFlowName: undefined,
        sourceSliceName: 'adjust inventory on payment',
      },
    ]);

    expect(result.states).toEqual([
      {
        type: 'InventoryReservation',
        fields: [
          { name: 'reservationId', tsType: 'string', required: true },
          { name: 'sku', tsType: 'string', required: true },
        ],
      },
    ]);

    expect(result.events.some((e) => e.type === 'InventoryReservation')).toBe(false);
    expect(result.events.some((e) => e.type === 'ReactToPaymentProcessed')).toBe(false);
  });

  it('should extract commands from normalized react when-command pattern', () => {
    const slice: Slice = {
      type: 'react',
      name: 'update workout progress',
      server: {
        description: 'Reacts to GymSessionLogged by updating workout progress',
        specs: [
          {
            type: 'gherkin',
            feature: 'Update workout progress reaction',
            rules: [
              {
                name: 'Progress update',
                examples: [
                  {
                    name: 'session triggers progress update',
                    steps: [
                      {
                        keyword: 'Given',
                        text: 'GymSessionLogged',
                        docString: { sessionId: 'gs_1' },
                      },
                      {
                        keyword: 'When',
                        text: 'UpdateWorkoutProgress',
                        docString: { userId: 'usr_1' },
                      },
                      {
                        keyword: 'Then',
                        text: 'WorkoutProgressUpdated',
                        docString: { userId: 'usr_1' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const allMessages: MessageDefinition[] = [
      {
        type: 'event',
        name: 'GymSessionLogged',
        fields: [{ name: 'sessionId', type: 'string', required: true }],
      },
      {
        type: 'command',
        name: 'UpdateWorkoutProgress',
        fields: [{ name: 'userId', type: 'string', required: true }],
      },
      {
        type: 'event',
        name: 'WorkoutProgressUpdated',
        fields: [{ name: 'userId', type: 'string', required: true }],
      },
    ];

    const result = extractMessagesFromSpecs(slice, allMessages);

    expect(result.events).toEqual([
      {
        type: 'GymSessionLogged',
        fields: [{ name: 'sessionId', tsType: 'string', required: true }],
        source: 'given',
        sourceFlowName: undefined,
        sourceSliceName: 'update workout progress',
      },
    ]);

    expect(result.commands).toEqual([
      {
        type: 'UpdateWorkoutProgress',
        fields: [{ name: 'userId', tsType: 'string', required: true }],
        source: 'then',
      },
    ]);
  });
});
