# Auto Engineer Changelog

# @auto-engineer/ai-gateway

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

# @auto-engineer/cli

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/file-store@1.0.1
  - @auto-engineer/narrative@1.0.1
  - @auto-engineer/pipeline@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/file-store@1.0.0
  - @auto-engineer/narrative@1.0.0
  - @auto-engineer/pipeline@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/file-store@0.26.3
  - @auto-engineer/narrative@0.26.3
  - @auto-engineer/pipeline@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/file-store@0.26.2
  - @auto-engineer/narrative@0.26.2
  - @auto-engineer/pipeline@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/file-store@0.26.1
  - @auto-engineer/narrative@0.26.1
  - @auto-engineer/pipeline@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/file-store@0.26.0
  - @auto-engineer/narrative@0.26.0
  - @auto-engineer/pipeline@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/file-store@0.25.0
  - @auto-engineer/narrative@0.25.0
  - @auto-engineer/pipeline@0.25.0

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
  - @auto-engineer/narrative@0.24.0
  - @auto-engineer/pipeline@0.24.0

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
  - @auto-engineer/narrative@0.23.0
  - @auto-engineer/pipeline@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.22.0
  - @auto-engineer/narrative@0.22.0
  - @auto-engineer/pipeline@0.22.0

## 0.21.2

### Patch Changes

- Combine WebSocket and Pipeline servers to serve from single port - file-sync now available at /file-sync path on same port as pipeline server

- Updated dependencies []:
  - @auto-engineer/file-store@0.21.2
  - @auto-engineer/narrative@0.21.2
  - @auto-engineer/pipeline@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.21.0
  - @auto-engineer/narrative@0.21.0
  - @auto-engineer/pipeline@0.21.0

## 0.20.0

### Minor Changes

- Add dual-mode CLI with importable server module
  - Export `startServer()` function from `@auto-engineer/cli/server` subpath
  - Support middleware injection via `httpMiddleware` and `socketMiddleware` options
  - Enable external packages to extend CLI server with custom auth/middleware

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.20.0
  - @auto-engineer/narrative@0.20.0
  - @auto-engineer/pipeline@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.19.0
  - @auto-engineer/narrative@0.19.0
  - @auto-engineer/pipeline@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.18.0
  - @auto-engineer/narrative@0.18.0
  - @auto-engineer/pipeline@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.17.1
  - @auto-engineer/file-store@0.17.1
  - @auto-engineer/pipeline@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.17.0
  - @auto-engineer/narrative@0.17.0
  - @auto-engineer/pipeline@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.16.0
  - @auto-engineer/pipeline@0.16.0
  - @auto-engineer/file-store@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.15.0
  - @auto-engineer/narrative@0.15.0
  - @auto-engineer/pipeline@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.14.0
  - @auto-engineer/narrative@0.14.0
  - @auto-engineer/pipeline@0.14.0

# @auto-engineer/frontend-implementer

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/ai-gateway@1.0.1
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/ai-gateway@1.0.0
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/ai-gateway@0.26.3
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/ai-gateway@0.26.2
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/ai-gateway@0.26.1
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/ai-gateway@0.26.0
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/ai-gateway@0.25.0
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/ai-gateway@0.24.0
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
  - @auto-engineer/ai-gateway@0.23.0
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.22.0
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.21.2
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/ai-gateway@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.20.0
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/ai-gateway@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/ai-gateway@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/ai-gateway@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/ai-gateway@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.14.0
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.0
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/ai-gateway@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.16
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.15
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.13
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.12
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11
  - @auto-engineer/ai-gateway@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.10
  - @auto-engineer/message-bus@0.11.10

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.5
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.4
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.3
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.2
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.1
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.0
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.13
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.12
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.11
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.10
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.9
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.8
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.7
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.6
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.5
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.4
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.3
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.2
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.1
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.9.0
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.14
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/ai-gateway@0.8.13
- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/ai-gateway@0.8.12
- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/ai-gateway@0.8.11
- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/ai-gateway@0.8.10
- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/ai-gateway@0.8.9
- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/ai-gateway@0.8.8
- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/ai-gateway@0.8.7
- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/ai-gateway@0.8.6
- @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- @auto-engineer/ai-gateway@0.8.5
- @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.4
  - @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3
  - @auto-engineer/ai-gateway@0.8.3

## 0.8.2

### Patch Changes

- @auto-engineer/ai-gateway@0.8.2
- @auto-engineer/message-bus@0.8.2

## 0.2.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.7.0
  - @auto-engineer/message-bus@0.6.0

## 0.1.4

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.3
  - @auto-engineer/message-bus@0.5.5

## 0.1.3

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.1.2

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.1.1

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2
  - @auto-engineer/ai-gateway@0.6.2

## 0.6.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.1
  - @auto-engineer/message-bus@0.5.1

## 0.6.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.0
  - @auto-engineer/message-bus@0.5.0

## 0.5.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.5.0
  - @auto-engineer/message-bus@0.4.0

## 0.4.10

### Patch Changes

- Version bump

## 0.4.7

### Patch Changes

- Add debug logging throughout packages for better debugging and issue tracking. Fix MCP server hanging issue in frontend-implementer by ensuring it only starts when run directly, not when imported as a module. The debug logs can be enabled by setting DEBUG environment variable (e.g., DEBUG=frontend-checks:_,frontend-impl:_)
- Updated dependencies
  - @auto-engineer/frontend-checks@0.4.6

## 0.4.6

### Patch Changes

- Update frontend-checks dependency to 0.4.5 to get automatic Playwright browser installation

## 0.4.3

### Patch Changes

- version testing
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.3
  - @auto-engineer/frontend-checks@0.4.3
  - @auto-engineer/message-bus@0.3.3

## 0.4.2

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.2
  - @auto-engineer/frontend-checks@0.4.2
  - @auto-engineer/message-bus@0.3.2

## 0.4.1

### Patch Changes

- Version bump to trigger builds
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.1
  - @auto-engineer/frontend-checks@0.4.1
  - @auto-engineer/message-bus@0.3.1

## 0.4.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

- Updated dependencies [[`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9), [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9)]:
  - @auto-engineer/ai-gateway@0.4.0
  - @auto-engineer/frontend-checks@0.4.0
  - @auto-engineer/message-bus@0.3.0

## 0.3.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

### Patch Changes

- Updated dependencies [[`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684)]:
  - @auto-engineer/ai-gateway@0.3.0
  - @auto-engineer/frontend-checks@0.3.0
  - @auto-engineer/message-bus@0.2.0

## 0.2.0

### Minor Changes

- [#24](https://github.com/SamHatoum/auto-engineer/pull/24) [`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Making commands independent and CLI based

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- Updated dependencies [[`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0), [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c)]:
  - @auto-engineer/frontend-checks@0.2.0
  - @auto-engineer/ai-gateway@0.2.0
  - @auto-engineer/message-bus@0.1.0

## 0.1.2

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.2
  - @auto-engineer/message-bus@0.0.3

## 0.1.1

### Patch Changes

- Bump versions to fix npm publish conflicts

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.1
  - @auto-engineer/frontend-checks@0.1.1
  - @auto-engineer/message-bus@0.0.2

# create-auto-app

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/id@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/id@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/id@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/id@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/id@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/id@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/id@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/id@0.24.0

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
  - @auto-engineer/id@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/id@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/id@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/id@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/id@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/id@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/id@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/id@0.11.5

## 0.11.4

### Patch Changes

- Fixes paths and deps

- Updated dependencies []:
  - @auto-engineer/id@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/id@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/id@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.10.3

## 0.10.2

### Patch Changes

- Fix cli issues

- Updated dependencies []:
  - @auto-engineer/id@0.10.2

## 0.10.1

### Patch Changes

- fixes esm issue

- Updated dependencies []:
  - @auto-engineer/id@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/id@0.9.12

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

## 0.3.0

### Minor Changes

- add command details in dashboard

## 0.2.3

### Patch Changes

- Bump versions

## 0.2.2

### Patch Changes

- renamed packages

## 0.2.1

### Patch Changes

- version bump for testihng

## 0.2.0

### Minor Changes

- Major overhaul of the plugin system

# @auto-engineer/design-system-importer

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
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
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3

## 0.8.2

### Patch Changes

- @auto-engineer/message-bus@0.8.2

## 0.7.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.6.0

## 0.6.5

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/message-bus@0.5.5

## 0.6.4

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.6.3

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.6.2

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2

## 0.6.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/message-bus@0.5.1

## 0.6.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.5.0

## 0.5.1

### Patch Changes

- Uses AI with a default provider

## 0.5.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.4.0

## 0.4.8

### Patch Changes

- version testing
- Updated dependencies
  - @auto-engineer/message-bus@0.3.3

## 0.4.7

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/message-bus@0.3.2

## 0.4.6

### Patch Changes

- Version bump to trigger builds
- Updated dependencies
  - @auto-engineer/message-bus@0.3.1

## 0.4.5

### Patch Changes

- Refactor TypeScript filter loading to use template files instead of inline strings for better maintainability

## 0.4.4

### Patch Changes

- Fix TypeScript filter loading to properly use local tsx installation

## 0.4.3

### Patch Changes

- Simplify TypeScript filter loading - require tsx to be installed locally in projects using TypeScript filters

## 0.4.2

### Patch Changes

- Fix tsx compatibility for both v3 and v4 versions

## 0.4.1

### Patch Changes

- b5576ee: Fix tsx resolution

## 0.4.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

- Updated dependencies [[`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9), [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9)]:
  - @auto-engineer/message-bus@0.3.0

## 0.3.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

### Patch Changes

- Updated dependencies [[`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684)]:
  - @auto-engineer/message-bus@0.2.0

## 0.2.0

### Minor Changes

- [#24](https://github.com/SamHatoum/auto-engineer/pull/24) [`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Making commands independent and CLI based

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- Updated dependencies [[`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c)]:
  - @auto-engineer/message-bus@0.1.0

## 0.1.2

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

- Updated dependencies []:
  - @auto-engineer/message-bus@0.0.3

## 0.1.1

### Patch Changes

- Bump versions to fix npm publish conflicts

- Updated dependencies []:
  - @auto-engineer/message-bus@0.0.2

# @auto-engineer/dev-server

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/cli@1.0.1
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/cli@1.0.0
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/cli@0.26.3
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/cli@0.26.2
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/cli@0.26.1
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/cli@0.26.0
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/cli@0.25.0
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/cli@0.24.0
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
  - @auto-engineer/cli@0.23.0
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.22.0
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.21.2
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/cli@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.20.0
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/cli@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/cli@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/cli@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/cli@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.14.0
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.13.0
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/cli@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/cli@0.11.16
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.15
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.13
  - @auto-engineer/message-bus@0.11.13

# @auto-engineer/file-store

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

# @auto-engineer/frontend-checks

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
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
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3

## 0.8.2

### Patch Changes

- @auto-engineer/message-bus@0.8.2

## 0.7.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.6.0

## 0.6.5

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/message-bus@0.5.5

## 0.6.4

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.6.3

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.6.2

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2

## 0.6.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/message-bus@0.5.1

## 0.6.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.5.0

## 0.5.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.4.0

## 0.4.8

### Patch Changes

- Version bump

## 0.4.6

### Patch Changes

- Add debug logging throughout packages for better debugging and issue tracking. Fix MCP server hanging issue in frontend-implementer by ensuring it only starts when run directly, not when imported as a module. The debug logs can be enabled by setting DEBUG environment variable (e.g., DEBUG=frontend-checks:_,frontend-impl:_)

## 0.4.5

### Patch Changes

- Fix Playwright browser auto-installation to make the package self-contained. The package now automatically installs Chromium browser when needed using npx, eliminating the need for manual browser installation.

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

## 0.1.3

### Patch Changes

- [`8546785`](https://github.com/SamHatoum/auto-engineer/commit/8546785f5a0b7225c1bb31c962b994a0561f2469) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix npm global installation by moving playwright to dependencies
  - Moved playwright from devDependencies to dependencies so it's available during install
  - Updated postinstall script to use npx for better compatibility

## 0.1.1

### Patch Changes

- Bump versions to fix npm publish conflicts

# @auto-engineer/frontend-react-graphql-generator

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/ai-gateway@1.0.1
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/ai-gateway@1.0.0
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/ai-gateway@0.26.3
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/ai-gateway@0.26.2
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/ai-gateway@0.26.1
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/ai-gateway@0.26.0
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/ai-gateway@0.25.0
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/ai-gateway@0.24.0
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
  - @auto-engineer/ai-gateway@0.23.0
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.22.0
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.21.2
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/ai-gateway@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.20.0
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/ai-gateway@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/ai-gateway@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/ai-gateway@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/ai-gateway@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.14.0
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.0
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/ai-gateway@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.16
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- improves template for singleton projections

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.15
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.13
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.12
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11
  - @auto-engineer/ai-gateway@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.10
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9
  - @auto-engineer/ai-gateway@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8
  - @auto-engineer/ai-gateway@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7
  - @auto-engineer/ai-gateway@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6
  - @auto-engineer/ai-gateway@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5
  - @auto-engineer/ai-gateway@0.11.5

## 0.11.4

### Patch Changes

- Fixes paths and deps

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.4
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.3
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.2
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1
  - @auto-engineer/ai-gateway@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0
  - @auto-engineer/ai-gateway@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.5
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.4
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.3
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.2
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.1
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.0
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.13
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.12
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.11
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.10
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.9
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.8
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.7
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.6
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.5
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.4
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.3
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.2
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.1
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.9.0
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.14
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/ai-gateway@0.8.13
- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/ai-gateway@0.8.12
- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/ai-gateway@0.8.11
- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/ai-gateway@0.8.10
- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/ai-gateway@0.8.9
- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/ai-gateway@0.8.8
- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/ai-gateway@0.8.7
- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/ai-gateway@0.8.6
- @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- @auto-engineer/ai-gateway@0.8.5
- @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.4
  - @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3
  - @auto-engineer/ai-gateway@0.8.3

## 0.8.2

### Patch Changes

- @auto-engineer/ai-gateway@0.8.2
- @auto-engineer/message-bus@0.8.2

## 0.2.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.7.0
  - @auto-engineer/message-bus@0.6.0

## 0.1.4

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.3
  - @auto-engineer/message-bus@0.5.5

## 0.1.3

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.1.2

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.1.1

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2
  - @auto-engineer/ai-gateway@0.6.2

## 0.4.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.1
  - @auto-engineer/message-bus@0.5.1

## 0.4.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.0
  - @auto-engineer/message-bus@0.5.0

## 0.3.1

### Patch Changes

- Uses AI with a default provider
- Updated dependencies
  - @auto-engineer/ai-gateway@0.5.1

## 0.3.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.5.0
  - @auto-engineer/message-bus@0.4.0

## 0.2.4

### Patch Changes

- Add debug logging throughout packages for better debugging and issue tracking. Fix MCP server hanging issue in frontend-implementer by ensuring it only starts when run directly, not when imported as a module. The debug logs can be enabled by setting DEBUG environment variable (e.g., DEBUG=frontend-checks:_,frontend-impl:_)

## 0.2.3

### Patch Changes

- TEST

## 0.2.2

### Patch Changes

- TEST

## 0.2.1

### Patch Changes

- version testing
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.3
  - @auto-engineer/message-bus@0.3.3

## 0.4.2

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.2
  - @auto-engineer/message-bus@0.3.2

## 0.4.1

### Patch Changes

- Version bump to trigger builds
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.1
  - @auto-engineer/message-bus@0.3.1

## 0.4.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

- Updated dependencies [[`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9), [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9)]:
  - @auto-engineer/ai-gateway@0.4.0
  - @auto-engineer/message-bus@0.3.0

## 0.3.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

### Patch Changes

- Updated dependencies [[`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684)]:
  - @auto-engineer/ai-gateway@0.3.0
  - @auto-engineer/message-bus@0.2.0

## 0.2.0

### Minor Changes

- [#24](https://github.com/SamHatoum/auto-engineer/pull/24) [`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Making commands independent and CLI based

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- Updated dependencies [[`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0), [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c)]:
  - @auto-engineer/ai-gateway@0.2.0
  - @auto-engineer/message-bus@0.1.0

## 0.1.2

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.2
  - @auto-engineer/message-bus@0.0.3

## 0.1.1

### Patch Changes

- Bump versions to fix npm publish conflicts

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.1
  - @auto-engineer/message-bus@0.0.2

# @auto-engineer/frontend-implementer

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/ai-gateway@1.0.1
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/ai-gateway@1.0.0
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/ai-gateway@0.26.3
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/ai-gateway@0.26.2
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/ai-gateway@0.26.1
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/ai-gateway@0.26.0
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/ai-gateway@0.25.0
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/ai-gateway@0.24.0
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
  - @auto-engineer/ai-gateway@0.23.0
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.22.0
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.21.2
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/ai-gateway@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.20.0
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/ai-gateway@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/ai-gateway@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/ai-gateway@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/ai-gateway@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.14.0
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.0
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/ai-gateway@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.16
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.15
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.13
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.12
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11
  - @auto-engineer/ai-gateway@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.10
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9
  - @auto-engineer/ai-gateway@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8
  - @auto-engineer/ai-gateway@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7
  - @auto-engineer/ai-gateway@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6
  - @auto-engineer/ai-gateway@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5
  - @auto-engineer/ai-gateway@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.4
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.3
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.2
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1
  - @auto-engineer/ai-gateway@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0
  - @auto-engineer/ai-gateway@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.5
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.4
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.3
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.2
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.1
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.0
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.13
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.12
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.11
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.10
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.9
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.8
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.7
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.6
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.5
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.4
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.3
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.2
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.1
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.9.0
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.14
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/ai-gateway@0.8.13
- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/ai-gateway@0.8.12
- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/ai-gateway@0.8.11
- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/ai-gateway@0.8.10
- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/ai-gateway@0.8.9
- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/ai-gateway@0.8.8
- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/ai-gateway@0.8.7
- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/ai-gateway@0.8.6
- @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- @auto-engineer/ai-gateway@0.8.5
- @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.4
  - @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3
  - @auto-engineer/ai-gateway@0.8.3

## 0.8.2

### Patch Changes

- @auto-engineer/ai-gateway@0.8.2
- @auto-engineer/message-bus@0.8.2

## 0.2.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.7.0
  - @auto-engineer/message-bus@0.6.0

## 0.1.4

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.3
  - @auto-engineer/message-bus@0.5.5

## 0.1.3

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.1.2

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.1.1

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2
  - @auto-engineer/ai-gateway@0.6.2

## 0.6.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.1
  - @auto-engineer/message-bus@0.5.1

## 0.6.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.0
  - @auto-engineer/message-bus@0.5.0

## 0.5.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.5.0
  - @auto-engineer/message-bus@0.4.0

## 0.4.10

### Patch Changes

- Version bump

## 0.4.7

### Patch Changes

- Add debug logging throughout packages for better debugging and issue tracking. Fix MCP server hanging issue in frontend-implementer by ensuring it only starts when run directly, not when imported as a module. The debug logs can be enabled by setting DEBUG environment variable (e.g., DEBUG=frontend-checks:_,frontend-impl:_)
- Updated dependencies
  - @auto-engineer/frontend-checks@0.4.6

## 0.4.6

### Patch Changes

- Update frontend-checks dependency to 0.4.5 to get automatic Playwright browser installation

## 0.4.3

### Patch Changes

- version testing
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.3
  - @auto-engineer/frontend-checks@0.4.3
  - @auto-engineer/message-bus@0.3.3

## 0.4.2

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.2
  - @auto-engineer/frontend-checks@0.4.2
  - @auto-engineer/message-bus@0.3.2

## 0.4.1

### Patch Changes

- Version bump to trigger builds
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.1
  - @auto-engineer/frontend-checks@0.4.1
  - @auto-engineer/message-bus@0.3.1

## 0.4.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

- Updated dependencies [[`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9), [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9)]:
  - @auto-engineer/ai-gateway@0.4.0
  - @auto-engineer/frontend-checks@0.4.0
  - @auto-engineer/message-bus@0.3.0

## 0.3.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

### Patch Changes

- Updated dependencies [[`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684)]:
  - @auto-engineer/ai-gateway@0.3.0
  - @auto-engineer/frontend-checks@0.3.0
  - @auto-engineer/message-bus@0.2.0

## 0.2.0

### Minor Changes

- [#24](https://github.com/SamHatoum/auto-engineer/pull/24) [`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Making commands independent and CLI based

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- Updated dependencies [[`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0), [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c)]:
  - @auto-engineer/frontend-checks@0.2.0
  - @auto-engineer/ai-gateway@0.2.0
  - @auto-engineer/message-bus@0.1.0

## 0.1.2

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.2
  - @auto-engineer/message-bus@0.0.3

## 0.1.1

### Patch Changes

- Bump versions to fix npm publish conflicts

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.1
  - @auto-engineer/frontend-checks@0.1.1
  - @auto-engineer/message-bus@0.0.2

# @auto-engineer/id

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

# @auto-engineer/information-architect

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/ai-gateway@1.0.1
  - @auto-engineer/message-bus@1.0.1
  - @auto-engineer/narrative@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/ai-gateway@1.0.0
  - @auto-engineer/message-bus@1.0.0
  - @auto-engineer/narrative@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/ai-gateway@0.26.3
  - @auto-engineer/message-bus@0.26.3
  - @auto-engineer/narrative@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/ai-gateway@0.26.2
  - @auto-engineer/message-bus@0.26.2
  - @auto-engineer/narrative@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/ai-gateway@0.26.1
  - @auto-engineer/message-bus@0.26.1
  - @auto-engineer/narrative@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/ai-gateway@0.26.0
  - @auto-engineer/message-bus@0.26.0
  - @auto-engineer/narrative@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/ai-gateway@0.25.0
  - @auto-engineer/message-bus@0.25.0
  - @auto-engineer/narrative@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/ai-gateway@0.24.0
  - @auto-engineer/message-bus@0.24.0
  - @auto-engineer/narrative@0.24.0

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
  - @auto-engineer/ai-gateway@0.23.0
  - @auto-engineer/message-bus@0.23.0
  - @auto-engineer/narrative@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.22.0
  - @auto-engineer/message-bus@0.22.0
  - @auto-engineer/narrative@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.21.2
  - @auto-engineer/message-bus@0.21.2
  - @auto-engineer/narrative@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/ai-gateway@0.21.0
  - @auto-engineer/narrative@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.20.0
  - @auto-engineer/message-bus@0.20.0
  - @auto-engineer/narrative@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/ai-gateway@0.19.0
  - @auto-engineer/narrative@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/ai-gateway@0.18.0
  - @auto-engineer/narrative@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.17.1
  - @auto-engineer/ai-gateway@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/ai-gateway@0.17.0
  - @auto-engineer/narrative@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.16.0
  - @auto-engineer/ai-gateway@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/ai-gateway@0.15.0
  - @auto-engineer/narrative@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.14.0
  - @auto-engineer/message-bus@0.14.0
  - @auto-engineer/narrative@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.13.3
  - @auto-engineer/ai-gateway@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.13.2
  - @auto-engineer/ai-gateway@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.13.1
  - @auto-engineer/ai-gateway@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.0
  - @auto-engineer/message-bus@0.13.0
  - @auto-engineer/narrative@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.12.1
  - @auto-engineer/ai-gateway@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/ai-gateway@0.12.0
  - @auto-engineer/narrative@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.20
  - @auto-engineer/ai-gateway@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.19
  - @auto-engineer/ai-gateway@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.18
  - @auto-engineer/ai-gateway@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.17
  - @auto-engineer/ai-gateway@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.16
  - @auto-engineer/message-bus@0.11.16
  - @auto-engineer/narrative@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.15
  - @auto-engineer/message-bus@0.11.15
  - @auto-engineer/narrative@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.14
  - @auto-engineer/ai-gateway@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.13
  - @auto-engineer/ai-gateway@0.11.13
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.12
  - @auto-engineer/ai-gateway@0.11.12
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11
  - @auto-engineer/ai-gateway@0.11.11
  - @auto-engineer/narrative@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.11.10
  - @auto-engineer/ai-gateway@0.11.10
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9
  - @auto-engineer/ai-gateway@0.11.9
  - @auto-engineer/flow@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8
  - @auto-engineer/ai-gateway@0.11.8
  - @auto-engineer/flow@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7
  - @auto-engineer/ai-gateway@0.11.7
  - @auto-engineer/flow@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6
  - @auto-engineer/ai-gateway@0.11.6
  - @auto-engineer/flow@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5
  - @auto-engineer/ai-gateway@0.11.5
  - @auto-engineer/flow@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.4
  - @auto-engineer/flow@0.11.4
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.3
  - @auto-engineer/flow@0.11.3
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.2
  - @auto-engineer/flow@0.11.2
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1
  - @auto-engineer/ai-gateway@0.11.1
  - @auto-engineer/flow@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0
  - @auto-engineer/ai-gateway@0.11.0
  - @auto-engineer/flow@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.5
  - @auto-engineer/ai-gateway@0.10.5
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.4
  - @auto-engineer/ai-gateway@0.10.4
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.3
  - @auto-engineer/ai-gateway@0.10.3
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.2
  - @auto-engineer/flow@0.10.2
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.1
  - @auto-engineer/flow@0.10.1
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.0
  - @auto-engineer/flow@0.10.0
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.13
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.12
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.11
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.10
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.9
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.8
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.7
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.6
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.5
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.4
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- [`7c6fcef`](https://github.com/SamHatoum/auto-engineer/commit/7c6fcef7dfdad827a1b4b74bc1a11a3c727dcead) Thanks [@SamHatoum](https://github.com/SamHatoum)! - fix: restore Git tag creation to enable GitHub releases

  Restores the custom Git tag creation logic that was working in v0.8.3. The createGithubReleases setting needs actual Git tags to exist before it can create GitHub releases. This adds back the tag creation steps that were accidentally removed, ensuring that both npm publishing and GitHub releases work correctly.

- [`14b1ba8`](https://github.com/SamHatoum/auto-engineer/commit/14b1ba8c689edaad586acce0d4defb9647f7cad1) Thanks [@SamHatoum](https://github.com/SamHatoum)! - test: verify that Git tag creation and GitHub releases work

  This changeset tests that our restored Git tag creation logic from v0.8.3 successfully creates both Git tags and GitHub releases when packages are published.

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.3
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- [`1060b10`](https://github.com/SamHatoum/auto-engineer/commit/1060b103eb8b99bc3b1f7ed29bdede9d3b0b445b) Thanks [@SamHatoum](https://github.com/SamHatoum)! - test: verify GitHub releases creation works in v0.9.2

  This changeset tests that the createGithubReleases functionality works properly after our configuration fixes. Should create GitHub releases and tags when published.

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.2
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- [`e789ce5`](https://github.com/SamHatoum/auto-engineer/commit/e789ce5edd6d94987cf431d674b9a85b942bc396) Thanks [@SamHatoum](https://github.com/SamHatoum)! - fix: remove unused import causing lint failure in CI

- [`70e5920`](https://github.com/SamHatoum/auto-engineer/commit/70e59201f8fbbc5c6f454bab7d2deb738f6e8ee6) Thanks [@SamHatoum](https://github.com/SamHatoum)! - test: trigger release to verify fixed GitHub workflow

  This is a test changeset to verify that the GitHub workflow now correctly creates tags and releases after fixing the conflicting tag creation logic.

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.1
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.9.0
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.14
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/ai-gateway@0.8.13
- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/ai-gateway@0.8.12
- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/ai-gateway@0.8.11
- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/ai-gateway@0.8.10
- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/ai-gateway@0.8.9
- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/ai-gateway@0.8.8
- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/ai-gateway@0.8.7
- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/ai-gateway@0.8.6
- @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- @auto-engineer/ai-gateway@0.8.5
- @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.4
  - @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3
  - @auto-engineer/ai-gateway@0.8.3

## 0.8.2

### Patch Changes

- @auto-engineer/ai-gateway@0.8.2
- @auto-engineer/message-bus@0.8.2

## 0.7.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.7.0
  - @auto-engineer/message-bus@0.6.0

## 0.6.5

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.3
  - @auto-engineer/message-bus@0.5.5

## 0.6.4

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.6.3

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.6.2

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2
  - @auto-engineer/ai-gateway@0.6.2

## 0.6.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.1
  - @auto-engineer/message-bus@0.5.1

## 0.6.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.0
  - @auto-engineer/message-bus@0.5.0

## 0.5.1

### Patch Changes

- Uses AI with a default provider
- Updated dependencies
  - @auto-engineer/ai-gateway@0.5.1

## 0.5.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.5.0
  - @auto-engineer/message-bus@0.4.0

## 0.4.3

### Patch Changes

- version testing
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.3
  - @auto-engineer/message-bus@0.3.3

## 0.4.2

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.2
  - @auto-engineer/message-bus@0.3.2

## 0.4.1

### Patch Changes

- Version bump to trigger builds
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.1
  - @auto-engineer/message-bus@0.3.1

## 0.4.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

- Updated dependencies [[`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9), [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9)]:
  - @auto-engineer/ai-gateway@0.4.0
  - @auto-engineer/message-bus@0.3.0

## 0.3.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

### Patch Changes

- Updated dependencies [[`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684)]:
  - @auto-engineer/ai-gateway@0.3.0
  - @auto-engineer/message-bus@0.2.0

## 0.2.0

### Minor Changes

- [#24](https://github.com/SamHatoum/auto-engineer/pull/24) [`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Making commands independent and CLI based

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- Updated dependencies [[`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0), [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c)]:
  - @auto-engineer/ai-gateway@0.2.0
  - @auto-engineer/message-bus@0.1.0

## 0.1.2

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.2
  - @auto-engineer/message-bus@0.0.3

## 0.1.1

### Patch Changes

- Bump versions to fix npm publish conflicts

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.1
  - @auto-engineer/message-bus@0.0.2

# @auto-engineer/message-bus

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

## 0.8.3

### Patch Changes

- 3aff24e: bump version up
- version bump

## 0.8.2

## 0.6.0

### Minor Changes

- add command details in dashboard

## 0.5.5

### Patch Changes

- Bump versions

## 0.5.4

### Patch Changes

- version test

## 0.5.3

### Patch Changes

- fix version report

## 0.5.2

### Patch Changes

- renamed packages

## 0.5.1

### Patch Changes

- version bump for testihng

## 0.5.0

### Minor Changes

- Major overhaul of the plugin system

## 0.4.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

## 0.3.3

### Patch Changes

- version testing

## 0.3.2

### Patch Changes

- Bump versions

## 0.3.1

### Patch Changes

- Version bump to trigger builds

## 0.3.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

## 0.2.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

## 0.1.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

## 0.0.3

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

## 0.0.2

### Patch Changes

- Bump versions to fix npm publish conflicts

# @auto-engineer/message-store

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
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
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/message-bus@0.8.6

# @auto-engineer/flow

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/file-store@1.0.1
  - @auto-engineer/id@1.0.1
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/file-store@1.0.0
  - @auto-engineer/id@1.0.0
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/file-store@0.26.3
  - @auto-engineer/id@0.26.3
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/file-store@0.26.2
  - @auto-engineer/id@0.26.2
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/file-store@0.26.1
  - @auto-engineer/id@0.26.1
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/file-store@0.26.0
  - @auto-engineer/id@0.26.0
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/file-store@0.25.0
  - @auto-engineer/id@0.25.0
  - @auto-engineer/message-bus@0.25.0

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
  - @auto-engineer/id@0.24.0
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
  - @auto-engineer/id@0.23.0
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.22.0
  - @auto-engineer/id@0.22.0
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.21.2
  - @auto-engineer/id@0.21.2
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/file-store@0.21.0
  - @auto-engineer/id@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.20.0
  - @auto-engineer/id@0.20.0
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/file-store@0.19.0
  - @auto-engineer/id@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/file-store@0.18.0
  - @auto-engineer/id@0.18.0

## 0.17.1

### Patch Changes

- use conditional TLA import for node:module to fix browser builds

- Updated dependencies []:
  - @auto-engineer/file-store@0.17.1
  - @auto-engineer/id@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example
- add first-class Module support for type ownership

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/file-store@0.17.0
  - @auto-engineer/id@0.17.0

## 0.16.0

### Minor Changes

- Adds new endpoints for on.auto

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.16.0
  - @auto-engineer/id@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/file-store@0.15.0
  - @auto-engineer/id@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.14.0
  - @auto-engineer/id@0.14.0
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- handle CJS/ESM interop for TypeScript dynamic import in browser

- Updated dependencies []:
  - @auto-engineer/file-store@0.13.3
  - @auto-engineer/id@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- add optional id to specs, steps, and client specs

- Updated dependencies []:
  - @auto-engineer/file-store@0.13.2
  - @auto-engineer/id@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- refactor from a given/when/then based format to Gherkin steps array

- Updated dependencies []:
  - @auto-engineer/file-store@0.13.1
  - @auto-engineer/id@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.13.0
  - @auto-engineer/id@0.13.0
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- migrate client specs from flat structure to nested describe/it

- Updated dependencies []:
  - @auto-engineer/file-store@0.12.1
  - @auto-engineer/id@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/file-store@0.12.0
  - @auto-engineer/id@0.12.0

## 0.11.20

### Patch Changes

- separate node exports from main index

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.20
  - @auto-engineer/id@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- improve browser compatibility

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.19
  - @auto-engineer/id@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- improve browser compatibility and bundle size

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.18
  - @auto-engineer/id@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Separate node functionality from platform agnostic functionality

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.17
  - @auto-engineer/id@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.16
  - @auto-engineer/id@0.11.16
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.15
  - @auto-engineer/id@0.11.15
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- support for singleton and composite ids projections

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.14
  - @auto-engineer/id@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- allows direct transition in gwt from .and() to .then()

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.13
  - @auto-engineer/id@0.11.13
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- default search pattern for getNarratives set to .narrative.ts

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.12
  - @auto-engineer/id@0.11.12
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11
  - @auto-engineer/file-store@0.11.11
  - @auto-engineer/id@0.11.11

## 0.11.10

### Patch Changes

- bumps version up

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.10
  - @auto-engineer/id@0.11.10
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9
  - @auto-engineer/file-store@0.11.9
  - @auto-engineer/id@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8
  - @auto-engineer/file-store@0.11.8
  - @auto-engineer/id@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7
  - @auto-engineer/file-store@0.11.7
  - @auto-engineer/id@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6
  - @auto-engineer/file-store@0.11.6
  - @auto-engineer/id@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5
  - @auto-engineer/file-store@0.11.5
  - @auto-engineer/id@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.4
  - @auto-engineer/id@0.11.4
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.3
  - @auto-engineer/id@0.11.3
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/file-store@0.11.2
  - @auto-engineer/id@0.11.2
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1
  - @auto-engineer/file-store@0.11.1
  - @auto-engineer/id@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0
  - @auto-engineer/file-store@0.11.0
  - @auto-engineer/id@0.11.0

## 0.10.5

### Patch Changes

- fix for modelToFlow to handle multiple flows in the same file

- Updated dependencies []:
  - @auto-engineer/file-store@0.10.5
  - @auto-engineer/id@0.10.5
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- getFlows returns an empty list when there are no flows instead of throwing an error

- Updated dependencies []:
  - @auto-engineer/file-store@0.10.4
  - @auto-engineer/id@0.10.4
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.10.3
  - @auto-engineer/id@0.10.3
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.10.2
  - @auto-engineer/id@0.10.2
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.10.1
  - @auto-engineer/id@0.10.1
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.10.0
  - @auto-engineer/id@0.10.0
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- stop modelToFLow emitting empty generics for empty when()

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.13
  - @auto-engineer/id@0.9.13
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- bug fixes for flow to model

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.12
  - @auto-engineer/id@0.9.12
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- bumps version up

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.11
  - @auto-engineer/id@0.9.11
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- handle dates correctly and separates type imports

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.10
  - @auto-engineer/id@0.9.10
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- browser support

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.9
  - @auto-engineer/id@0.9.9
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- adds dynamic import of @prettier/plugin-typescript if available

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.8
  - @auto-engineer/id@0.9.8
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- handles ids in modelToFlow

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.7
  - @auto-engineer/id@0.9.7
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- fixes modelToFlow not inferring unused fields in types correctly

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.6
  - @auto-engineer/id@0.9.6
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- modelToFlow support for experience

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.5
  - @auto-engineer/id@0.9.5
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- bump version up

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.4
  - @auto-engineer/id@0.9.4
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.3
  - @auto-engineer/id@0.9.3
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.2
  - @auto-engineer/id@0.9.2
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/file-store@0.9.1
  - @auto-engineer/id@0.9.1
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/file-store@0.9.0
  - @auto-engineer/id@0.9.0
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/file-store@0.8.14
  - @auto-engineer/id@0.8.14
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- bump version up
  - @auto-engineer/file-store@0.8.13
  - @auto-engineer/id@0.8.13
  - @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- Updated dependencies
  - @auto-engineer/id@0.8.12
  - @auto-engineer/file-store@0.8.12
  - @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- bumps version up
  - @auto-engineer/file-store@0.8.11
  - @auto-engineer/id@0.8.11
  - @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- bumps version up
  - @auto-engineer/file-store@0.8.10
  - @auto-engineer/id@0.8.10
  - @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- removes noEmitHelpers breaking browser compatibility
  - @auto-engineer/file-store@0.8.9
  - @auto-engineer/id@0.8.9
  - @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- compilerHost that works in all environments
  - @auto-engineer/file-store@0.8.8
  - @auto-engineer/id@0.8.8
  - @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- fixes browser compatibility
  - @auto-engineer/file-store@0.8.7
  - @auto-engineer/id@0.8.7
  - @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- adds id generation
  - @auto-engineer/file-store@0.8.6
  - @auto-engineer/id@0.8.6
  - @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- Adds ids to rules
  - @auto-engineer/file-store@0.8.5
  - @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- @auto-engineer/file-store@0.8.4
- @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3
  - @auto-engineer/file-store@0.8.3

## 0.8.2

### Patch Changes

- fixes package.json dependencies
  - @auto-engineer/file-store@0.8.2
  - @auto-engineer/message-bus@0.8.2

## 0.3.0

### Minor Changes

- migrates flow dsl to support new hierarchical specs → rules → examples

## 0.2.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/file-store@0.4.0
  - @auto-engineer/message-bus@0.6.0

## 0.1.7

### Patch Changes

- in browsers returns stubs for externals

## 0.1.6

### Patch Changes

- version bump

## 0.1.5

### Patch Changes

- ensure browser compatible

## 0.1.4

### Patch Changes

- additionally retuens externals and typings for flows
- Bump versions
- Updated dependencies
  - @auto-engineer/file-store@0.3.3
  - @auto-engineer/message-bus@0.5.5

## 0.1.3

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.1.2

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.1.1

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2
  - @auto-engineer/file-store@0.3.2

## 0.7.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/file-store@0.3.1
  - @auto-engineer/message-bus@0.5.1

## 0.7.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/file-store@0.3.0
  - @auto-engineer/message-bus@0.5.0

## 0.6.1

### Patch Changes

- removes top-level `url` import to restore browser compatibility

## 0.6.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/file-store@0.2.0
  - @auto-engineer/message-bus@0.4.0

## 0.5.8

### Patch Changes

- isolate Node-only file store usage behind getFs helper

## 0.5.7

### Patch Changes

- use NodeFileStore for commands export to restore browser compatibility

## 0.5.6

### Patch Changes

- Updated dependencies
  - @auto-engineer/file-store@0.1.2

## 0.5.5

### Patch Changes

- version bump
- Updated dependencies
  - @auto-engineer/file-store@0.1.1

## 0.5.3

### Patch Changes

- version testing
- Updated dependencies
  - @auto-engineer/message-bus@0.3.3

## 0.5.2

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/message-bus@0.3.2

## 0.5.1

### Patch Changes

- Version bump to trigger builds
- Updated dependencies
  - @auto-engineer/message-bus@0.3.1

## 0.5.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

- Updated dependencies [[`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9), [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9)]:
  - @auto-engineer/message-bus@0.3.0

## 0.4.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

### Patch Changes

- Updated dependencies [[`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684)]:
  - @auto-engineer/message-bus@0.2.0

## 0.3.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- Updated dependencies [[`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c)]:
  - @auto-engineer/message-bus@0.1.0

## 0.2.0

### Minor Changes

- [`96c6f02`](https://github.com/SamHatoum/auto-engineer/commit/96c6f02989f9856a269367f42e288c7dbf5dd1d3) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fixes paths and logs

- [`91a124f`](https://github.com/SamHatoum/auto-engineer/commit/91a124ff09ecb5893571d0d6fc86e51eaac7a3f0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fixes global bins.

### Patch Changes

- [`988ab04`](https://github.com/SamHatoum/auto-engineer/commit/988ab04530d41e116df9196434c0e57ff2ee11a8) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix export:schema command and add comprehensive debug logging
  - Fixed export-schema command to use npx tsx for TypeScript support
  - Added proper JSON extraction from stdout to handle integration logs
  - Resolved issue where export:schema produced empty schemas despite valid flow definitions
  - Added debug library for comprehensive logging throughout flow
  - Improved debugging output for flow registration, imports, and integrations
  - Use DEBUG=flow:\* environment variable to enable detailed debugging

- [`6b8a9e4`](https://github.com/SamHatoum/auto-engineer/commit/6b8a9e4b618b0ecda3656e695f5e51e40992fc40) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix export:schema command module resolution issue

  Fixed an issue where `auto export:schema` would produce empty schema files due to module context mismatch. The export-schema-helper now imports getFlows from the project's node_modules to ensure the same module context is used, allowing integrations to be properly registered and included in the schema.

## 0.1.3

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

- Updated dependencies []:
  - @auto-engineer/message-bus@0.0.3

## 0.1.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.0.2

# @auto-engineer/pipeline

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/file-store@1.0.1
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/file-store@1.0.0
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/file-store@0.26.3
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/file-store@0.26.2
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/file-store@0.26.1
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/file-store@0.26.0
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/file-store@0.25.0
  - @auto-engineer/message-bus@0.25.0

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

# @auto-engineer/release-automation

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

- [#40](https://github.com/BeOnAuto/auto-engineer/pull/40) [`c7e4f17`](https://github.com/BeOnAuto/auto-engineer/commit/c7e4f1774937ead19fe46e9d3ca19208cbc24f16) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - **global**: create @auto-engineer/release-automation package

### Patch Changes

- [`48a1981`](https://github.com/BeOnAuto/auto-engineer/commit/48a1981f2ea9e345a62f1cedd646016a9fb5ace0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI jobs for more efficient build and release processes
  - Fixed binary linking issue in release automation that could prevent proper package publishing

- [#40](https://github.com/BeOnAuto/auto-engineer/pull/40) [`c7e4f17`](https://github.com/BeOnAuto/auto-engineer/commit/c7e4f1774937ead19fe46e9d3ca19208cbc24f16) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - **global**: add explicit exit 0 to pre-push hook

- [`42ad1e5`](https://github.com/BeOnAuto/auto-engineer/commit/42ad1e5bb31b89b56b920ed84a151a7c68dd2e5b) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Fixed an issue where special characters in commit messages could break Slack notifications

# @auto-engineer/server-checks

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/cli@1.0.1
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/cli@1.0.0
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/cli@0.26.3
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/cli@0.26.2
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/cli@0.26.1
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/cli@0.26.0
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/cli@0.25.0
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/cli@0.24.0
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
  - @auto-engineer/cli@0.23.0
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.22.0
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.21.2
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/cli@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.20.0
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/cli@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/cli@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/cli@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/cli@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.14.0
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.13.0
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/cli@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/cli@0.11.16
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.15
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.13
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.12
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11
  - @auto-engineer/cli@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.10
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9
  - @auto-engineer/cli@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8
  - @auto-engineer/cli@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7
  - @auto-engineer/cli@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6
  - @auto-engineer/cli@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5
  - @auto-engineer/cli@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.4
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.11.3
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/cli@0.11.2
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1
  - @auto-engineer/cli@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0
  - @auto-engineer/cli@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.10.5
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.10.4
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.10.3
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.10.2
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.10.1
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.10.0
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.9.13
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.9.12
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.9.11
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/cli@0.9.10
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3

## 0.8.2

### Patch Changes

- @auto-engineer/message-bus@0.8.2

## 0.2.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.6.0

## 0.1.4

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/message-bus@0.5.5

## 0.1.3

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.1.2

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.1.1

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2

## 0.2.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/message-bus@0.5.1

## 0.2.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.5.0

## 0.1.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/message-bus@0.4.0

# @auto-engineer/server-generator-apollo-emmett

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/message-bus@1.0.1
  - @auto-engineer/narrative@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/message-bus@1.0.0
  - @auto-engineer/narrative@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/message-bus@0.26.3
  - @auto-engineer/narrative@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/message-bus@0.26.2
  - @auto-engineer/narrative@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/message-bus@0.26.1
  - @auto-engineer/narrative@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/message-bus@0.26.0
  - @auto-engineer/narrative@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/message-bus@0.25.0
  - @auto-engineer/narrative@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/message-bus@0.24.0
  - @auto-engineer/narrative@0.24.0

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
  - @auto-engineer/message-bus@0.23.0
  - @auto-engineer/narrative@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.22.0
  - @auto-engineer/narrative@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.2
  - @auto-engineer/narrative@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/narrative@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.20.0
  - @auto-engineer/narrative@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/narrative@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/narrative@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/narrative@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/narrative@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.14.0
  - @auto-engineer/narrative@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.13.0
  - @auto-engineer/narrative@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/narrative@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.16
  - @auto-engineer/narrative@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.15
  - @auto-engineer/narrative@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.13
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.11.12
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11
  - @auto-engineer/narrative@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.11.10
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9
  - @auto-engineer/flow@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8
  - @auto-engineer/flow@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7
  - @auto-engineer/flow@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6
  - @auto-engineer/flow@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5
  - @auto-engineer/flow@0.11.5

## 0.11.4

### Patch Changes

- Fixes paths and deps

- Updated dependencies []:
  - @auto-engineer/flow@0.11.4
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Fixes paths issue

- Updated dependencies []:
  - @auto-engineer/flow@0.11.3
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/flow@0.11.2
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1
  - @auto-engineer/flow@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0
  - @auto-engineer/flow@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.5
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.4
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.3
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.2
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.1
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.10.0
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.13
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.12
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.11
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.10
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.9
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.8
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.7
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.6
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.5
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.4
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.3
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.2
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/flow@0.9.1
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.9.0
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/flow@0.8.14
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.13
  - @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/flow@0.8.12
- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.11
  - @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.10
  - @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.9
  - @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.8
  - @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.7
  - @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.6
  - @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.5
  - @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- @auto-engineer/flow@0.8.4
- @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3
  - @auto-engineer/flow@0.8.3

## 0.8.2

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.8.2
  - @auto-engineer/message-bus@0.8.2

## 0.2.1

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.3.0

## 0.2.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.2.0
  - @auto-engineer/message-bus@0.6.0

## 0.1.4

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/flow@0.1.4
  - @auto-engineer/message-bus@0.5.5

## 0.1.3

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4
  - @auto-engineer/flow@0.1.3

## 0.1.2

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3
  - @auto-engineer/flow@0.1.2

## 0.1.1

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2
  - @auto-engineer/flow@0.1.1

## 0.8.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/flow@0.7.1
  - @auto-engineer/message-bus@0.5.1

## 0.8.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.7.0
  - @auto-engineer/message-bus@0.5.0

## 0.7.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/flow@0.6.0
  - @auto-engineer/message-bus@0.4.0

## 0.6.3

### Patch Changes

- version testing
- Updated dependencies
  - @auto-engineer/flow@0.5.3
  - @auto-engineer/message-bus@0.3.3

## 0.6.2

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/flow@0.5.2
  - @auto-engineer/message-bus@0.3.2

## 0.6.1

### Patch Changes

- Version bump to trigger builds
- Updated dependencies
  - @auto-engineer/flow@0.5.1
  - @auto-engineer/message-bus@0.3.1

## 0.6.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

- Updated dependencies [[`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9), [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9)]:
  - @auto-engineer/flow@0.5.0
  - @auto-engineer/message-bus@0.3.0

## 0.5.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

### Patch Changes

- Updated dependencies [[`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684)]:
  - @auto-engineer/flow@0.4.0
  - @auto-engineer/message-bus@0.2.0

## 0.4.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- Updated dependencies [[`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c)]:
  - @auto-engineer/flow@0.3.0
  - @auto-engineer/message-bus@0.1.0

## 0.3.0

### Minor Changes

- [`8d7dbc7`](https://github.com/SamHatoum/auto-engineer/commit/8d7dbc719362aafa1e8473dd57fd783d8efe7e6b) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Adds debugging

### Patch Changes

- [`9bf1a16`](https://github.com/SamHatoum/auto-engineer/commit/9bf1a164490e50445ca468aafd8dd9619c4f73cf) Thanks [@SamHatoum](https://github.com/SamHatoum)! - fixed lint issues

- Updated dependencies [[`96c6f02`](https://github.com/SamHatoum/auto-engineer/commit/96c6f02989f9856a269367f42e288c7dbf5dd1d3), [`988ab04`](https://github.com/SamHatoum/auto-engineer/commit/988ab04530d41e116df9196434c0e57ff2ee11a8), [`6b8a9e4`](https://github.com/SamHatoum/auto-engineer/commit/6b8a9e4b618b0ecda3656e695f5e51e40992fc40), [`91a124f`](https://github.com/SamHatoum/auto-engineer/commit/91a124ff09ecb5893571d0d6fc86e51eaac7a3f0)]:
  - @auto-engineer/flow@0.2.0

## 0.2.2

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

- Updated dependencies []:
  - @auto-engineer/flow@0.1.3
  - @auto-engineer/message-bus@0.0.3

## 0.2.1

### Patch Changes

- Bump versions to fix npm publish conflicts

- Updated dependencies []:
  - @auto-engineer/message-bus@0.0.2
  - @auto-engineer/flow@0.1.2

# @auto-engineer/server-generator-nestjs

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/narrative@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/narrative@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/narrative@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/narrative@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/narrative@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/narrative@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/narrative@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/narrative@0.24.0

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
  - @auto-engineer/narrative@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/narrative@0.15.0

# @auto-engineer/server-implementer

## 1.0.1

### Patch Changes

- [`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: update ketchup plan - Burst 4 complete
  - **pipeline**: update ketchup plan - Burst 4 blocked on CLI publish

- [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Looking at these commits, they are both internal housekeeping changes related to a "ketchup plan" (which appears to be a development workflow tracking document based on the CLAUDE.md context). These are not user-facing changes.
  - Updated internal development tracking documentation

- Updated dependencies [[`f8360ec`](https://github.com/BeOnAuto/auto-engineer/commit/f8360ec5e39297cbfd1a2ffb13ec83592ce12b13), [`17c8146`](https://github.com/BeOnAuto/auto-engineer/commit/17c814614c42f24f7a6fe1dc407ed4298994ea4d)]:
  - @auto-engineer/ai-gateway@1.0.1
  - @auto-engineer/message-bus@1.0.1

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

### Patch Changes

- Updated dependencies [[`b00fcec`](https://github.com/BeOnAuto/auto-engineer/commit/b00fcece918f10c391ac24606baf0ac1d882bff9), [`e46d374`](https://github.com/BeOnAuto/auto-engineer/commit/e46d374fbaea0ed20b865cca3961966448e704e3)]:
  - @auto-engineer/ai-gateway@1.0.0
  - @auto-engineer/message-bus@1.0.0

## 0.26.3

### Patch Changes

- [`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **narrative**: remove redundant id field from Module, use sourceFile as identifier
- Updated dependencies [[`e2539a5`](https://github.com/BeOnAuto/auto-engineer/commit/e2539a5c1e0648ae297d4f49680b4699fd67f075)]:
  - @auto-engineer/ai-gateway@0.26.3
  - @auto-engineer/message-bus@0.26.3

## 0.26.2

### Patch Changes

- [`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: version packages
  - **global**: consolidate CI into single job
  - **global**: merge publish workflow into build-and-test

- [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67) Thanks [@rami-hatoum](https://github.com/rami-hatoum)! - - Simplified module identification by using source file path instead of separate ID field

- Updated dependencies [[`6fc3c3f`](https://github.com/BeOnAuto/auto-engineer/commit/6fc3c3f3b83a534963749a21b56d53b34f65ed97), [`21d6645`](https://github.com/BeOnAuto/auto-engineer/commit/21d6645c53ae0da46e7557a9dac058e7da0afd67)]:
  - @auto-engineer/ai-gateway@0.26.2
  - @auto-engineer/message-bus@0.26.2

## 0.26.1

### Patch Changes

- [`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Merged the publish workflow into the build-and-test workflow for faster, more streamlined releases
  - Eliminated workflow trigger delays by running release jobs directly after successful builds on main branch

- [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **global**: read version from cli package and skip hooks for tag push
  - **global**: version packages
  - **global**: merge publish workflow into build-and-test

- [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Consolidated CI workflow into a single job, reducing release build time from ~4 minutes to ~1 minute
  - Release steps now run conditionally only on main branch pushes
- Updated dependencies [[`55262c8`](https://github.com/BeOnAuto/auto-engineer/commit/55262c8b74a0e5bf4e2bde2dc393486ddef7ed1c), [`f3a86f3`](https://github.com/BeOnAuto/auto-engineer/commit/f3a86f39e11b1bf0161372f2a6ccdca710967430), [`65817de`](https://github.com/BeOnAuto/auto-engineer/commit/65817debd6cc7333e1a1d165433a2e23441a4270)]:
  - @auto-engineer/ai-gateway@0.26.1
  - @auto-engineer/message-bus@0.26.1

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
- Updated dependencies [[`4d1f540`](https://github.com/BeOnAuto/auto-engineer/commit/4d1f540e37a7a28d3b1ee0abc249d934553b4359), [`43c5ec3`](https://github.com/BeOnAuto/auto-engineer/commit/43c5ec3bdd4dbfbacf09e6e3d15f9dadb273c9c1)]:
  - @auto-engineer/ai-gateway@0.26.0
  - @auto-engineer/message-bus@0.26.0

## 0.25.0

### Minor Changes

- [`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`dd69fb0`](https://github.com/BeOnAuto/auto-engineer/commit/dd69fb082429603d093c49b974d0a83514828f6f)]:
  - @auto-engineer/ai-gateway@0.25.0
  - @auto-engineer/message-bus@0.25.0

## 0.24.0

### Minor Changes

- [`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - - **packages/narrative**: adds id field to data
  - **cli**: consolidate servers onto single port
  - **pipeline**: add getHttpServer() method to PipelineServer
  - **cli**: update package.json exports for server and add types
  - **cli**: update Ketchup Plan and streamline startServer implementation

### Patch Changes

- Updated dependencies [[`9f33c48`](https://github.com/BeOnAuto/auto-engineer/commit/9f33c48a5e345b4e0735951c2b77d47d5e936d78)]:
  - @auto-engineer/ai-gateway@0.24.0
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
  - @auto-engineer/ai-gateway@0.23.0
  - @auto-engineer/message-bus@0.23.0

## 0.22.0

### Minor Changes

- Adds id field to data sink and data source

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.22.0
  - @auto-engineer/message-bus@0.22.0

## 0.21.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.21.2
  - @auto-engineer/message-bus@0.21.2

## 0.21.0

### Minor Changes

- Unifies ports on cli

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.21.0
  - @auto-engineer/ai-gateway@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.20.0
  - @auto-engineer/message-bus@0.20.0

## 0.19.0

### Minor Changes

- adds "typical" example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.19.0
  - @auto-engineer/ai-gateway@0.19.0

## 0.18.0

### Minor Changes

- Add middleware support

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.18.0
  - @auto-engineer/ai-gateway@0.18.0

## 0.17.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.17.1
  - @auto-engineer/message-bus@0.17.1

## 0.17.0

### Minor Changes

- Adds new minimal example

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.17.0
  - @auto-engineer/ai-gateway@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.16.0
  - @auto-engineer/message-bus@0.16.0

## 0.15.0

### Minor Changes

- version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.15.0
  - @auto-engineer/ai-gateway@0.15.0

## 0.14.0

### Minor Changes

- Rewrite CLI and Pipeline

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.14.0
  - @auto-engineer/message-bus@0.14.0

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.3
  - @auto-engineer/message-bus@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.2
  - @auto-engineer/message-bus@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.1
  - @auto-engineer/message-bus@0.13.1

## 0.13.0

### Minor Changes

- Removes auto prefix from ids

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.13.0
  - @auto-engineer/message-bus@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.12.1
  - @auto-engineer/message-bus@0.12.1

## 0.12.0

### Minor Changes

- Upgrade vercel ai sdk

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.12.0
  - @auto-engineer/ai-gateway@0.12.0

## 0.11.20

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.20
  - @auto-engineer/message-bus@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.19
  - @auto-engineer/message-bus@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.18
  - @auto-engineer/message-bus@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.17
  - @auto-engineer/message-bus@0.11.17

## 0.11.16

### Patch Changes

- version bump

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.16
  - @auto-engineer/message-bus@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.15
  - @auto-engineer/message-bus@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.14
  - @auto-engineer/message-bus@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.13
  - @auto-engineer/message-bus@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.12
  - @auto-engineer/message-bus@0.11.12

## 0.11.11

### Patch Changes

- Change flow to Narrative

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.11
  - @auto-engineer/ai-gateway@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.10
  - @auto-engineer/message-bus@0.11.10

## 0.11.9

### Patch Changes

- Upgrade oai to gpt-5

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.9
  - @auto-engineer/ai-gateway@0.11.9

## 0.11.8

### Patch Changes

- fix kanban todo paths

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.8
  - @auto-engineer/ai-gateway@0.11.8

## 0.11.7

### Patch Changes

- Fix template paths issue

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.7
  - @auto-engineer/ai-gateway@0.11.7

## 0.11.6

### Patch Changes

- fix test retries

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.6
  - @auto-engineer/ai-gateway@0.11.6

## 0.11.5

### Patch Changes

- Fix paths and deps issues

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.5
  - @auto-engineer/ai-gateway@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.4
  - @auto-engineer/message-bus@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.3
  - @auto-engineer/message-bus@0.11.3

## 0.11.2

### Patch Changes

- Fixes pipeline not showing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.11.2
  - @auto-engineer/message-bus@0.11.2

## 0.11.1

### Patch Changes

- Updates missing deps for todo-list example

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.1
  - @auto-engineer/ai-gateway@0.11.1

## 0.11.0

### Minor Changes

- Version bump

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/message-bus@0.11.0
  - @auto-engineer/ai-gateway@0.11.0

## 0.10.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.5
  - @auto-engineer/message-bus@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.4
  - @auto-engineer/message-bus@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.3
  - @auto-engineer/message-bus@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.2
  - @auto-engineer/message-bus@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.1
  - @auto-engineer/message-bus@0.10.1

## 0.10.0

### Minor Changes

- New templates and bug fixes

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.10.0
  - @auto-engineer/message-bus@0.10.0

## 0.9.13

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.13
  - @auto-engineer/message-bus@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.12
  - @auto-engineer/message-bus@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.11
  - @auto-engineer/message-bus@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.10
  - @auto-engineer/message-bus@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.9
  - @auto-engineer/message-bus@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.8
  - @auto-engineer/message-bus@0.9.8

## 0.9.7

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.7
  - @auto-engineer/message-bus@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.6
  - @auto-engineer/message-bus@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.5
  - @auto-engineer/message-bus@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.4
  - @auto-engineer/message-bus@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.3
  - @auto-engineer/message-bus@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.2
  - @auto-engineer/message-bus@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.9.1
  - @auto-engineer/message-bus@0.9.1

## 0.9.0

### Minor Changes

- add a new experience slice type

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.9.0
  - @auto-engineer/message-bus@0.9.0

## 0.8.14

### Patch Changes

- Update flow to not require slice
- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.14
  - @auto-engineer/message-bus@0.8.14

## 0.8.13

### Patch Changes

- @auto-engineer/ai-gateway@0.8.13
- @auto-engineer/message-bus@0.8.13

## 0.8.12

### Patch Changes

- @auto-engineer/ai-gateway@0.8.12
- @auto-engineer/message-bus@0.8.12

## 0.8.11

### Patch Changes

- @auto-engineer/ai-gateway@0.8.11
- @auto-engineer/message-bus@0.8.11

## 0.8.10

### Patch Changes

- @auto-engineer/ai-gateway@0.8.10
- @auto-engineer/message-bus@0.8.10

## 0.8.9

### Patch Changes

- @auto-engineer/ai-gateway@0.8.9
- @auto-engineer/message-bus@0.8.9

## 0.8.8

### Patch Changes

- @auto-engineer/ai-gateway@0.8.8
- @auto-engineer/message-bus@0.8.8

## 0.8.7

### Patch Changes

- @auto-engineer/ai-gateway@0.8.7
- @auto-engineer/message-bus@0.8.7

## 0.8.6

### Patch Changes

- @auto-engineer/ai-gateway@0.8.6
- @auto-engineer/message-bus@0.8.6

## 0.8.5

### Patch Changes

- @auto-engineer/ai-gateway@0.8.5
- @auto-engineer/message-bus@0.8.5

## 0.8.4

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.8.4
  - @auto-engineer/message-bus@0.8.4

## 0.8.3

### Patch Changes

- Updated dependencies [3aff24e]
- Updated dependencies
  - @auto-engineer/message-bus@0.8.3
  - @auto-engineer/ai-gateway@0.8.3

## 0.8.2

### Patch Changes

- @auto-engineer/ai-gateway@0.8.2
- @auto-engineer/message-bus@0.8.2

## 0.7.0

### Minor Changes

- add command details in dashboard

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.7.0
  - @auto-engineer/message-bus@0.6.0

## 0.6.5

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.3
  - @auto-engineer/message-bus@0.5.5

## 0.6.4

### Patch Changes

- version test
- Updated dependencies
  - @auto-engineer/message-bus@0.5.4

## 0.6.3

### Patch Changes

- fix version report
- Updated dependencies
  - @auto-engineer/message-bus@0.5.3

## 0.6.2

### Patch Changes

- renamed packages
- Updated dependencies
  - @auto-engineer/message-bus@0.5.2
  - @auto-engineer/ai-gateway@0.6.2

## 0.6.1

### Patch Changes

- version bump for testihng
- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.1
  - @auto-engineer/message-bus@0.5.1

## 0.6.0

### Minor Changes

- Major overhaul of the plugin system

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.6.0
  - @auto-engineer/message-bus@0.5.0

## 0.5.1

### Patch Changes

- Uses AI with a default provider
- Updated dependencies
  - @auto-engineer/ai-gateway@0.5.1

## 0.5.0

### Minor Changes

- • All cli commands now use commands and emit events on the bus

### Patch Changes

- Updated dependencies
  - @auto-engineer/ai-gateway@0.5.0
  - @auto-engineer/message-bus@0.4.0

## 0.4.3

### Patch Changes

- version testing
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.3

## 0.4.2

### Patch Changes

- Bump versions
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.2

## 0.4.1

### Patch Changes

- Version bump to trigger builds
- Updated dependencies
  - @auto-engineer/ai-gateway@0.4.1

## 0.4.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- [`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9) Thanks [@SamHatoum](https://github.com/SamHatoum)! - global version bump to test release process

- Updated dependencies [[`f3e97e5`](https://github.com/SamHatoum/auto-engineer/commit/f3e97e563b79ca8328e802dd502e65285ec58ce9), [`927b39a`](https://github.com/SamHatoum/auto-engineer/commit/927b39a2c08c0baa1942b2955a8e8015e09364d9)]:
  - @auto-engineer/ai-gateway@0.4.0

## 0.3.0

### Minor Changes

- [`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Fix multiple dependency issues

### Patch Changes

- Updated dependencies [[`330afa5`](https://github.com/SamHatoum/auto-engineer/commit/330afa565079e3b528d0f448d64919a8dc78d684)]:
  - @auto-engineer/ai-gateway@0.3.0

## 0.2.0

### Minor Changes

- [#22](https://github.com/SamHatoum/auto-engineer/pull/22) [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c) Thanks [@SamHatoum](https://github.com/SamHatoum)! - Some major refactorings of the directory structure

### Patch Changes

- Updated dependencies [[`d4dcacd`](https://github.com/SamHatoum/auto-engineer/commit/d4dcacd18cf2217d3ac9f4354f79ab7ff2ba39a0), [`e39acf3`](https://github.com/SamHatoum/auto-engineer/commit/e39acf31e9051652084d0de99cf8c89b40e6531c)]:
  - @auto-engineer/ai-gateway@0.2.0

## 0.1.2

### Patch Changes

- Fix workspace:\* dependencies to use actual version numbers for npm publishing

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.2

## 0.1.1

### Patch Changes

- Bump versions to fix npm publish conflicts

- Updated dependencies []:
  - @auto-engineer/ai-gateway@0.1.1
