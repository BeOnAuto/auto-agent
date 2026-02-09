# @auto-engineer/ai-gateway

## 1.12.0

### Minor Changes

- [`a425971`](https://github.com/BeOnAuto/auto-engineer/commit/a4259717bdd3bd1c9f0194c9c33c46bbff510f00) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: add @auto-engineer/narrative/schema subpath export
  - **packages/model-diff**: new package for model-level change detection (incremental generation)
  - **packages/server-generator-apollo-emmett**: add incremental generation support via model-diff change sets
  - **global**: version packages
  - **global**: add changeset

## 1.11.0

### Minor Changes

- [`94f3151`](https://github.com/BeOnAuto/auto-engineer/commit/94f315181e69e190f84ba06871b27591e27771c2) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Added a lightweight schema subpath export for the narrative package, allowing consumers to import Zod schemas and TypeScript types without pulling in heavy dependencies like typescript, prettier, or graphql

- [`afd1cd2`](https://github.com/BeOnAuto/auto-engineer/commit/afd1cd28412d12ba7c29ba133fdf57616cf42370) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/frontend-implementer**: updates implementation prompt
  - **global**: version packages
  - **global**: add changeset

## 1.10.0

### Minor Changes

- [`f3e6b55`](https://github.com/BeOnAuto/auto-engineer/commit/f3e6b5566b2ab37e4b945bd04168b994f394b33b) Thanks [@osamanar](https://github.com/osamanar)! - - Updated the implementation prompt for the frontend implementer to improve code generation quality

- [`3480c66`](https://github.com/BeOnAuto/auto-engineer/commit/3480c6658781048289c14ee58636825126334d1c) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/information-architect**: adds template generation to FE app generation
  - **global**: version packages
  - **global**: add changeset
  - **global**: fix pnpm lock file
  - **global**: add changeset

## 1.9.0

### Minor Changes

- [`9cca67b`](https://github.com/BeOnAuto/auto-engineer/commit/9cca67b7c85953d297a632a268829cc18a168e3a) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **cli**: implement delegation pattern for FileSyncer reset
  - **global**: version packages
  - **global**: add changeset
  - **global**: update ketchup settings
  - **cli**: update ketchup plan with completed burst

- [#43](https://github.com/BeOnAuto/auto-engineer/pull/43) [`af76242`](https://github.com/BeOnAuto/auto-engineer/commit/af762423f8adfad0796f2f3a6483fb931c7b0bf1) Thanks [@osamanar](https://github.com/osamanar)! - - Added template generation capability to frontend app generation in the information architect package

### Patch Changes

- [#43](https://github.com/BeOnAuto/auto-engineer/pull/43) [`31aab4f`](https://github.com/BeOnAuto/auto-engineer/commit/31aab4f3114d6fd8f60fa2239fff9d567a78e321) Thanks [@osamanar](https://github.com/osamanar)! - - Fixed package manager lock file to ensure consistent dependency installation

## 1.8.0

### Minor Changes

- [`c383ec4`](https://github.com/BeOnAuto/auto-engineer/commit/c383ec4bae483e32d6b747575f2311a67e488a41) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Implemented delegation pattern for FileSyncer reset, allowing the server to swap file syncer instances without re-registering socket handlers
  - Made FileSyncer stop operation async and idempotent with proper startup/shutdown guards
  - Updated ketchup development workflow settings

- [`9479f7a`](https://github.com/BeOnAuto/auto-engineer/commit/9479f7a5ebb999907028873cdfcc43b692bfe28a) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **cli**: default file sync directory to narratives
  - **husky**: handle non-zero exit codes from changeset generator under sh -e
  - **global**: version packages
  - **global**: add changeset
  - **global**: exclude .ketchup from biome checks

## 1.7.0

### Minor Changes

- [`876f240`](https://github.com/BeOnAuto/auto-engineer/commit/876f24011aa2b97fcfdd226de4c33756ce10dc13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: add MappingEntrySchema, update slice schemas to use structured mappings
  - **narrative**: add MappingFieldRefSchema for structured mapping references
  - **global**: version packages

- [`22da0bb`](https://github.com/BeOnAuto/auto-engineer/commit/22da0bba412bdc78ef7aded96a4d6acafdd6aafc) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Changed file sync default directory to "narratives" for better organization of synchronized content

### Patch Changes

- [`86e9bc9`](https://github.com/BeOnAuto/auto-engineer/commit/86e9bc95d163bb6ea8861cb4db2fa39905e9afc2) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Fixed an issue where the changeset generator could cause failures in strict shell environments by properly handling non-zero exit codes

- [`b0ca671`](https://github.com/BeOnAuto/auto-engineer/commit/b0ca6714c090f5ce3b0831353efc2a94f4ad0321) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Added Ketchup configuration for the project

- [`1783963`](https://github.com/BeOnAuto/auto-engineer/commit/17839632724eaae84bfbbe8f0b90cc6b777c0eff) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Excluded .ketchup directory from code formatting and linting checks

- [`6eb8e24`](https://github.com/BeOnAuto/auto-engineer/commit/6eb8e242410b7c396472aa720c137400f694ec9b) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Here's the changelog based on the actual changes:
  - Added structured mapping schemas to narrative slices, enabling field-level mapping references between commands and queries
  - Fixed changeset generator failures in strict shell environments by properly handling non-zero exit codes
  - Added Ketchup configuration for project automation, validation rules, and development workflow hooks

- [`1ebdd34`](https://github.com/BeOnAuto/auto-engineer/commit/1ebdd3475f00e20a6e47e5306d0e2abd743b6067) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Fixed an issue where the changeset generator could fail in strict shell environments due to non-zero exit codes

## 1.6.0

### Minor Changes

- [`c47d7b7`](https://github.com/BeOnAuto/auto-engineer/commit/c47d7b7b5de04a4da7d5f2ce62211cbe64e23603) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: add optional mappings field to CommandSliceSchema and QuerySliceSchema
  - **global**: version packages

## 1.5.5

### Patch Changes

- [`237ff60`](https://github.com/BeOnAuto/auto-engineer/commit/237ff604674b188645017b7f80cf5d248aadc5b1) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **pipeline**: register foreach-phased handlers with PhasedExecutor
  - **global**: version packages
  - **global**: add changeset

## 1.5.4

### Patch Changes

- [`4eeece7`](https://github.com/BeOnAuto/auto-engineer/commit/4eeece7f0894d49e62b374dd0461d9a41bbe169b) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **narrative**: wrap Date fields in nested objects and arrays with new Date()
  - **global**: version packages
  - **global**: add changeset

- [`867ff17`](https://github.com/BeOnAuto/auto-engineer/commit/867ff17b14e0167f362a88a7d14b6b6e75702774) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Fixed registration of foreach-phased handlers to properly work with the PhasedExecutor

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

## 0.8.11

## 0.8.10

## 0.8.9

## 0.8.8

## 0.8.7

## 0.8.6

## 0.8.5

## 0.8.4

### Patch Changes

- bump version up

## 0.8.3

## 0.8.2

## 0.7.0

### Minor Changes

- add command details in dashboard

## 0.6.3

### Patch Changes

- Bump versions

## 0.6.2

### Patch Changes

- renamed packages

## 0.6.1

### Patch Changes

- version bump for testihng

## 0.6.0

### Minor Changes

- Major overhaul of the plugin system

## 0.5.1

### Patch Changes

- Uses AI with a default provider

## 0.5.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

## 0.4.3

### Patch Changes

- version testing

## 0.4.2

### Patch Changes

- Bump versions

## 0.4.1

### Patch Changes

- Version bump to trigger builds

## 0.4.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

## 0.3.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

## 0.2.0

### Minor Changes

- [#24](https://github.com/SamHatoum/auto-engineer/pull/24) [`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Making commands independent and CLI based

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

## 0.1.2

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

## 0.1.1

### Patch Changes

- Bump versions to fix npm publish conflicts
