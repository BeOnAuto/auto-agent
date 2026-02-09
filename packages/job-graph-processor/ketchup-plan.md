# Ketchup Plan: ProcessJobGraph Command Handler + E2E Tests

## TODO

(empty)

## DONE

### Bottle: Defensive input validation

- [x] Burst 1: guard submit against missing jobs array (ecd82695)

### Bottle: Dispatch target commands via dispatch callback

- [x] Burst 1: submit sends target commands for initial ready jobs (caa7abf9)
- [x] Burst 2: onJobEvent sends target commands for newly ready dependent jobs (0b4be016)
- [x] Burst 3: accept dispatch callback instead of using messageBus.sendCommand (2505b01e)
- [x] Burst 4: PipelineContext.sendCommand accepts optional correlationId override (0d858127)
- [x] Burst 5: process-job-graph handler wires ctx.sendCommand as dispatch (41f044c5)

### Bottle: Pipeline Command Handler + E2E Tests

- [x] Burst 1: Command handler + test for graph.dispatching (4e876184)
- [x] Burst 2: Test handler returns graph.failed when messageBus missing (4e876184)
- [x] Burst 3: Test handler returns graph.failed for invalid graph (4e876184)
- [x] Burst 4: Export COMMANDS array (772f16a4)
- [x] Burst 5: E2E — registry shows ProcessJobGraph (8da16e8a)
- [x] Burst 6: E2E — command callable, produces graph.dispatching (8da16e8a)
- [x] Burst 7: E2E — full lifecycle, graph.completed via correlation (8da16e8a)
- [x] Burst 8: Wire plugin into typical example (30ab6969)
- [x] Burst 9: Update README (c2a955a6)
