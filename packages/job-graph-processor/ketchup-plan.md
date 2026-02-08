# Ketchup Plan: ProcessJobGraph Command Handler + E2E Tests

## TODO

- [ ] Burst 1: Command handler + test for graph.dispatching [depends: none]
- [ ] Burst 2: Test handler returns graph.failed when messageBus missing [depends: 1]
- [ ] Burst 3: Test handler returns graph.failed for invalid graph [depends: 1]
- [ ] Burst 4: Export COMMANDS array [depends: 1]
- [ ] Burst 5: E2E — registry shows ProcessJobGraph [depends: 4]
- [ ] Burst 6: E2E — command callable, produces graph.dispatching [depends: 5]
- [ ] Burst 7: E2E — full lifecycle, graph.completed via correlation [depends: 6]
- [ ] Burst 8: Wire plugin into typical example [depends: 4]
- [ ] Burst 9: Update README [depends: 7]
- [ ] Burst 10: Update ketchup-plan.md [depends: 9]

## DONE
