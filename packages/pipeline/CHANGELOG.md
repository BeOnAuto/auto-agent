# @auto-engineer/pipeline

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/file-store@0.24.0
  - @auto-engineer/message-bus@0.24.0

## 0.23.0

### Minor Changes

- [#40](https://github.com/BeOnAuto/auto-engineer/pull/40) [`c7e4f17`](https://github.com/BeOnAuto/auto-engineer/commit/c7e4f1774937ead19fe46e9d3ca19208cbc24f16) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - **global**: add OSS-friendly fallbacks for changeset generation
  - **global**: automate release workflow with pre-push changesets
  - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer

- [#40](https://github.com/BeOnAuto/auto-engineer/pull/40) [`c7e4f17`](https://github.com/BeOnAuto/auto-engineer/commit/c7e4f1774937ead19fe46e9d3ca19208cbc24f16) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - **global**: create @auto-engineer/release-automation package

### Patch Changes

- [`48a1981`](https://github.com/BeOnAuto/auto-engineer/commit/48a1981f2ea9e345a62f1cedd646016a9fb5ace0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI jobs for more efficient build and release processes
  - Fixed binary linking issue in release automation that could prevent proper package publishing

- [#40](https://github.com/BeOnAuto/auto-engineer/pull/40) [`c7e4f17`](https://github.com/BeOnAuto/auto-engineer/commit/c7e4f1774937ead19fe46e9d3ca19208cbc24f16) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - **global**: add explicit exit 0 to pre-push hook

- [`42ad1e5`](https://github.com/BeOnAuto/auto-engineer/commit/42ad1e5bb31b89b56b920ed84a151a7c68dd2e5b) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Fixed an issue where special characters in commit messages could break Slack notifications

- Updated dependencies [[`48a1981`](https://github.com/BeOnAuto/auto-engineer/commit/48a1981f2ea9e345a62f1cedd646016a9fb5ace0), [`c7e4f17`](https://github.com/BeOnAuto/auto-engineer/commit/c7e4f1774937ead19fe46e9d3ca19208cbc24f16), [`c7e4f17`](https://github.com/BeOnAuto/auto-engineer/commit/c7e4f1774937ead19fe46e9d3ca19208cbc24f16), [`c7e4f17`](https://github.com/BeOnAuto/auto-engineer/commit/c7e4f1774937ead19fe46e9d3ca19208cbc24f16), [`42ad1e5`](https://github.com/BeOnAuto/auto-engineer/commit/42ad1e5bb31b89b56b920ed84a151a7c68dd2e5b)]:
  - @auto-engineer/file-store@0.23.0
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.22.0
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.21.2
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/file-store@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.20.0
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/file-store@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/file-store@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/file-store@0.17.0

## 0.16.0

### Minor Changes

- Adds new endpoints for on.auto

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/file-store@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.14.0
  - @auto-engineer/message-bus@0.14.0
  - @auto-engineer/message-store@0.14.0
