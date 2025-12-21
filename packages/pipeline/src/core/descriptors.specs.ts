import type { Event } from './types';
import type { KeyExtractor, PipelineDescriptor } from './descriptors';

describe('PipelineDescriptor', () => {
  it('should create PipelineDescriptor', () => {
    const descriptor: PipelineDescriptor = {
      name: 'test-pipeline',
      version: '1.0.0',
      keys: new Map(),
      handlers: [],
    };
    expect(descriptor.name).toBe('test-pipeline');
  });

  it('should store key extractors', () => {
    const extractor: KeyExtractor = (e: Event) => e.data.slicePath ?? '';
    const keys = new Map<string, KeyExtractor>();
    keys.set('bySlice', extractor);

    const descriptor: PipelineDescriptor = {
      name: 'test',
      keys,
      handlers: [],
    };
    expect(descriptor.keys.get('bySlice')).toBe(extractor);
  });
});
