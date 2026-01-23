# @auto-engineer/id

## 1.5.3

### Patch Changes

- [`6a7fa7f`](https://github.com/BeOnAuto/auto-engineer/commit/6a7fa7f848f45bad2b2e97e39404155d8987623d) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Fixed Date fields not being properly converted when nested inside objects and arrays

- [`d7f22bb`](https://github.com/BeOnAuto/auto-engineer/commit/d7f22bbe745dc14ebd273d4ffa24ffe62adb95c0) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: export cross-module types and improve Date field handling
  - **global**: version packages
  - **global**: add changeset

## 1.5.2

### Patch Changes

- [`02f70b8`](https://github.com/BeOnAuto/auto-engineer/commit/02f70b8e3be0655ab340c53e2ac2082a3ddc10ef) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: use browser-compatible path utilities in cross-module-imports
  - **global**: version packages
  - **global**: add changeset

- [`e5883d0`](https://github.com/BeOnAuto/auto-engineer/commit/e5883d0db038d1f95645a46ce528cbd153bde277) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Exported cross-module types for better integration between modules
  - Improved Date field handling in the narrative package

## 1.5.1

### Patch Changes

- [`6afefa3`](https://github.com/BeOnAuto/auto-engineer/commit/6afefa3cd483930b2cea1933f6b0d3e84a546a9b) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: add query support to isMessageKind type guard
  - **global**: version packages
  - **global**: add changeset

- [`6edb039`](https://github.com/BeOnAuto/auto-engineer/commit/6edb0394444edcab597b6d149b3928debe9824c8) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Fixed browser compatibility issues with path utilities in cross-module imports

## 1.5.0

### Minor Changes

- [`0cc358d`](https://github.com/BeOnAuto/auto-engineer/commit/0cc358da85ce6b62a786d66d9ecd7da63299e169) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: add query detection for When clauses in query slices
  - **global**: version packages
  - **global**: add changeset

### Patch Changes

- [`ad7cd86`](https://github.com/BeOnAuto/auto-engineer/commit/ad7cd868b47194512938a26fc34b15d6e6de7dd4) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Added query support to the isMessageKind type guard in the narrative package

## 1.4.0

### Minor Changes

- [`c2503a1`](https://github.com/BeOnAuto/auto-engineer/commit/c2503a1cfb342ab1399a382d175def1a8239e2b9) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Added query detection for When clauses in query slices, enabling better handling of query-based conditions in narrative definitions

### Patch Changes

- [`a0cf1a8`](https://github.com/BeOnAuto/auto-engineer/commit/a0cf1a8a41faa1a8f4687b0b80be745d1f7a0091) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: generate all declared types for authored modules
  - **global**: version packages
  - **global**: add changeset

## 1.3.4

### Patch Changes

- [`f2ee305`](https://github.com/BeOnAuto/auto-engineer/commit/f2ee305eb055873d93cfe30f2a0f49ee297393c1) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: handle negative numbers in jsonToExpr
  - **global**: version packages
  - **global**: add changeset

- [`22916b0`](https://github.com/BeOnAuto/auto-engineer/commit/22916b01abc8cee787e79be7aea01de579e30ec3) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Fixed type generation to include all declared types for authored modules

## 1.3.3

### Patch Changes

- [`6832039`](https://github.com/BeOnAuto/auto-engineer/commit/683203980ec147c5b9de506f8a97303b7f5d39c3) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: handle empty then array in chainThenCall
  - **global**: version packages
  - **global**: add changeset

- [`03cdbfd`](https://github.com/BeOnAuto/auto-engineer/commit/03cdbfdfe934152d5ff7118608ef96ead56b032b) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Fixed handling of negative numbers in expression conversion

## 1.3.2

### Patch Changes

- [`f382d2a`](https://github.com/BeOnAuto/auto-engineer/commit/f382d2a5e02cba90a4a772088dd1d46fd9470929) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: republish with correct workspace dependency resolution
  - **global**: version packages
  - **global**: add changeset

- [`4c060da`](https://github.com/BeOnAuto/auto-engineer/commit/4c060da8da6f08f0d689f513c9b3e67af46766de) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Fixed an issue where empty action chains could cause errors in the narrative system

## 1.3.1

### Patch Changes

- [`f6ec207`](https://github.com/BeOnAuto/auto-engineer/commit/f6ec207cd6cd3457aca2ab8202677101fe531cd6) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Fixed workspace dependency resolution for the narrative package to ensure correct publishing

## 2.0.0

### Major Changes

- [`c3a1f4f`](https://github.com/BeOnAuto/auto-engineer/commit/c3a1f4f51bdda9cd97f839c0f9a3d2664518388a) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **cli**: rename suspend hooks to generic shutdown hooks (#42)

### Patch Changes

- [`6770053`](https://github.com/BeOnAuto/auto-engineer/commit/67700538ddd17656eb0de17b1a16d5f7e4ca14f6) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Fixed incorrect argument order in test code generation for it/describe blocks

## 1.2.0

### Minor Changes

- [`d1865ee`](https://github.com/BeOnAuto/auto-engineer/commit/d1865eeaf0f18e311c61cca0e233d68a6c2f57a9) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - Graceful Worker Suspend with UI Disconnect (#41)
  - **global**: version packages

## 1.1.2

### Patch Changes

- [`1695c1d`](https://github.com/BeOnAuto/auto-engineer/commit/1695c1d715bfcf404e5dcf0ed503a6aa78648c66) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **root**: use new commit instead of amend for changesets
  - **global**: version packages

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

### Patch Changes

- browser safe id generation

## 0.8.11

## 0.8.10

## 0.8.9

## 0.8.8

## 0.8.7

## 0.8.6
