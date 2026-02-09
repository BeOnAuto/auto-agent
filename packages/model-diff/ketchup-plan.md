# Ketchup Plan: Model-Level Change Detection

## TODO

- [ ] Burst 18: `index.ts` exports [depends: 17]
- [ ] Burst 19: Server generator — extract `createSliceGeneratedEvent` helper [depends: none]
- [ ] Burst 20: Server generator — add `affectedSliceIds` filter [depends: none]
- [ ] Burst 21: Server generator — modify handler for 3-mode generation [depends: 18, 19, 20]
- [ ] Burst 22: Pipeline configs — update auto.config.ts files [depends: 18]

## DONE

- [x] Burst 1: infra — scaffold `packages/model-diff` (4d32a30b)
- [x] Burst 2: `stableStringify` — deterministic JSON output (f04e4db2)
- [x] Burst 3+4: `toKebabCase` + `walkStepsByKeyword` — utils and step walking (25f27b92)
- [x] Burst 5-11: model dependency functions — message refs, event/command sources, integrations, shared types hash (fe598616)
- [x] Burst 12-14: fingerprinting — buildSliceSnapshot, computeFingerprintFromSnapshot, computeAllSnapshots/Fingerprints (59f1f61e)
- [x] Burst 15: generation state persistence — load/save with version check (f0a38fbe)
- [x] Burst 16: change set computation — computeChangeSet (01eb77d9)
- [x] Burst 17: `DetectChanges` command handler [depends: 11, 14, 15, 16] (4e76515b)
