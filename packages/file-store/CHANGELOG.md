# @auto-engineer/file-store

## 1.1.1

### Patch Changes

- [`0d9693f`](https://github.com/BeOnAuto/auto-engineer/commit/0d9693fee7c2a4105b104204b96773ffaebaecd6) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **root**: check remote status before generating changesets
  - **global**: version packages

## 1.1.0

### Minor Changes

- [`6b4be43`](https://github.com/BeOnAuto/auto-engineer/commit/6b4be43ce12cf8562f7202ce7272bcbb0bca9a85) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **cli**: expose messageBus on ServerHandle, remove onEvent option
  - **global**: version packages

## 1.0.2

### Patch Changes

- [`d7d07cb`](https://github.com/BeOnAuto/auto-engineer/commit/d7d07cb7c699496d61b6794391aa6a57d7a1af44) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: remove completed ketchup plan
  - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

## 1.0.0

### Major Changes

- [`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Added event subscription API to pipeline server, allowing external code to subscribe to all pipeline events via `getMessageBus()` and `subscribeAll()`
  - Replaced `onPipelineActivity` callback with `onEvent` in CLI server options for true event-sourced activity tracking (breaking change)
  - Added support for loading command handlers directly from config files via `COMMANDS` array export

- [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **cli**: replace onPipelineActivity with onEvent using subscribeAll
  - **cli**: load COMMANDS from config file as command handlers
  - **pipeline**: publish events to message bus when command handlers emit
  - **pipeline**: export MessageBus, EventHandler, EventSubscription types
  - **pipeline**: add getMessageBus() method to PipelineServer

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes

## 0.26.0

### Minor Changes

- [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- [`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Fixed version reading to use CLI package instead of root package.json
  - Improved tag push workflow by skipping pre-push hooks
  - Cleaned up duplicate tagging for create-auto-app package

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

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

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

## 0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

## 0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

## 0.18.0

### Minor Changes

- Add middleware support

## 0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

## 0.16.0

## 0.15.0

### Minor Changes

- version bump

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

## 0.13.3

## 0.13.2

## 0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

## 0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

## 0.11.20

## 0.11.19

## 0.11.18

## 0.11.17

### Patch Changes

- Separate node functionality from platform agnostic functionality

## 0.11.16

### Patch Changes

- version bump

## 0.11.15

## 0.11.14

## 0.11.13

## 0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

## 0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

## 0.11.8

### Patch Changes

- fix kanban todo paths

## 0.11.7

### Patch Changes

- Fix template paths issue

## 0.11.6

### Patch Changes

- fix test retries

## 0.11.5

### Patch Changes

- Fix paths and deps issues

## 0.11.4

## 0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

## 0.11.0

### Minor Changes

- Version bump

## 0.10.5

## 0.10.4

## 0.10.3

## 0.10.2

## 0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

## 0.9.13

## 0.9.12

## 0.9.11

## 0.9.10

## 0.9.9

## 0.9.8

## 0.9.7

## 0.9.6

## 0.9.5

## 0.9.4

## 0.9.3

## 0.9.2

## 0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

## 0.8.14

### Patch Changes

- Update flow to not require slice

## 0.8.13

## 0.8.12

## 0.8.11

## 0.8.10

## 0.8.9

## 0.8.8

## 0.8.7

## 0.8.6

## 0.8.5

## 0.8.4

## 0.8.3

## 0.8.2

## 0.4.0

### Minor Changes

- add command details in dashboard

## 0.3.3

### Patch Changes

- Bump versions

## 0.3.2

### Patch Changes

- renamed packages

## 0.3.1

### Patch Changes

- version bump for testihng

## 0.3.0

### Minor Changes

- Major overhaul of the plugin system

## 0.2.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

## 0.1.3

### Patch Changes

- removes redundant files

## 0.1.2

### Patch Changes

- adds listTree, readFileText to FileWatcher

## 0.1.1

### Patch Changes

- version bump
