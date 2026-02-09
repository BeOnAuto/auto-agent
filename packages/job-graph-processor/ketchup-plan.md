# Ketchup Plan: ProcessJobGraph Command Handler + E2E Tests

## TODO

### Bottle: Dispatch target commands via dispatch callback

- [x] Burst 1: submit sends target commands for initial ready jobs [depends: none]
- [x] Burst 2: onJobEvent sends target commands for newly ready dependent jobs [depends: 1]
- [x] Burst 3: accept dispatch callback instead of using messageBus.sendCommand [depends: 2]
- [ ] Burst 4: process-job-graph handler wires ctx.sendCommand as dispatch [depends: 3]

## DONE

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
