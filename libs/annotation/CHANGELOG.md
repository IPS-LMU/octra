# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.2.1](https://github.com/IPS-LMU/octra/compare/annotation-1.2.0...annotation-1.2.1) (2025-07-28)


### Bug Fixes

* **octra:** PraatTableConverter loaded as plain text in URL mode ([d6d882a](https://github.com/IPS-LMU/octra/commit/d6d882a3fb49db6fca44c050c779d64a41a3978f))


### Features

* **octra:** continue paused tasks later ([276b9f4](https://github.com/IPS-LMU/octra/commit/276b9f46620983cf5e26e7431fb9a1d7cd560b1f))



# [1.2.0](https://github.com/IPS-LMU/octra/compare/annotation-1.1.1...annotation-1.2.0) (2025-06-24)


### Features

* **annotation:** PartiturConverter now supports SPK labels ([21f9ae0](https://github.com/IPS-LMU/octra/commit/21f9ae0708d5786fd368c373e5e5e102443cfc41))



## [1.1.1](https://github.com/IPS-LMU/octra/compare/annotation-1.1.0...annotation-1.1.1) (2025-04-02)



# [1.1.0](https://github.com/IPS-LMU/octra/compare/annotation-1.0.0...annotation-1.1.0) (2025-03-05)

### Bug Fixes

- **annotation:** PraatTableConverter does not import empty units properly ([41c1b96](https://github.com/IPS-LMU/octra/commit/41c1b96601b4cbb002f101a56ece4d7e0e51b007))
- **annotation:** PraatTextgridConverter should not need equal file names ([4e4c2e4](https://github.com/IPS-LMU/octra/commit/4e4c2e40a62d29be9f53199a05902cfff5e3a080))
- **ngx-components:** magnifier not working properly ([3d92813](https://github.com/IPS-LMU/octra/commit/3d928137a9afcb285477dc13e6b0310d17d7b01f))

### Features

- **annotation:** TextConverter imports/exports timestamps with ">" instead of "/>" ([0f58bd7](https://github.com/IPS-LMU/octra/commit/0f58bd7c2ea3a8dd8360e15f7333abd8791e9fa4))

# [1.0.0](https://github.com/IPS-LMU/octra/compare/annotation-0.1.17...annotation-1.0.0) (2025-01-13)

### Bug Fixes

- **annotation:** SRT converter combines same speaker units incorrectly ([16806e1](https://github.com/IPS-LMU/octra/commit/16806e1138c714b8bfd26305cabd2e1da4b16120))
- **octra:** visible escape codes on shortcuts modal ([e7a63fb](https://github.com/IPS-LMU/octra/commit/e7a63fb542ee0841e21ffae1cdf9704a22525b1c))

### Features

- **annotation:** more information about supported apps foreach annotation format ([1a6e192](https://github.com/IPS-LMU/octra/commit/1a6e192d30d31af4820bbbe02ebfe252c23e9bc7))
- **octra:** import options can be set in projectconfig.json for each converter ([f1addb2](https://github.com/IPS-LMU/octra/commit/f1addb2e762a5f37ab02b371dde1103168074fe6))
- **octra:** upgrade to Nx 20 incl. Angular 19 ([5850cbc](https://github.com/IPS-LMU/octra/commit/5850cbcb71a6664ca53e9a038443e913390910c3))

## [0.1.17](https://github.com/IPS-LMU/octra/compare/annotation-0.1.16...annotation-0.1.17) (2024-12-03)

### Bug Fixes

- **annotation:** srt converter identifies speaker if pattern is undefined on import ([33839c1](https://github.com/IPS-LMU/octra/commit/33839c13787881e727475e45bf0bc29d5bb476c5))
- **annotation:** SRTConverter ignores milliseconds on import ([67a1b68](https://github.com/IPS-LMU/octra/commit/67a1b6828b637046982c904b3247555b46242319))

## [0.1.16](https://github.com/IPS-LMU/octra/compare/annotation-0.1.15...annotation-0.1.16) (2024-11-18)

## [0.1.15](https://github.com/IPS-LMU/octra/compare/annotation-0.1.14...annotation-0.1.15) (2024-11-08)

### Bug Fixes

- **annotation:** speaker pattern matching not working with SRT converter ([e92e72b](https://github.com/IPS-LMU/octra/commit/e92e72b6ad38258d1717fdb4225d9cfbce964eb0))

### Features

- **octra:** new line option for text converter ([e670ad9](https://github.com/IPS-LMU/octra/commit/e670ad91fbe0414c515d34585ff2625cf2cec114))

## [0.1.14](https://github.com/IPS-LMU/octra/compare/annotation-0.1.13...annotation-0.1.14) (2024-07-29)

### Bug Fixes

- **annotation:** srt import doesn't combine units of same speaker correctly ([2f41036](https://github.com/IPS-LMU/octra/commit/2f41036a90eb756872ccc4118729f989c9910243))
- **octra:** overview can not be opened after srt import ([679fec1](https://github.com/IPS-LMU/octra/commit/679fec11d298a2998d584ed83c82fed83059f242))
- **octra:** url mode loads wrong data if logged-in in other tab ([efaa5ad](https://github.com/IPS-LMU/octra/commit/efaa5ad3fe64308f78363fd078a8d214663912a3))

### Features

- **octra:** new query param for url mode "aType" for export type ([69a9fa1](https://github.com/IPS-LMU/octra/commit/69a9fa15314e5bc304d73010693559dc605aa405))
- **octra:** SRT import with special import options ([8bd4111](https://github.com/IPS-LMU/octra/commit/8bd4111373784735ad0b7d19be016a908afea060))

## [0.1.13](https://github.com/IPS-LMU/octra/compare/annotation-0.1.12...annotation-0.1.13) (2024-03-25)

### Bug Fixes

- **annotation:** importing ELAN file fails on unknown attributes ([745a67f](https://github.com/IPS-LMU/octra/commit/745a67f356f2188b64634726c3a761e32b51134f))
- **ngx-components:** slow audio viewer ([d8e36fa](https://github.com/IPS-LMU/octra/commit/d8e36fa002b1d295b5cccc1dcd08c2fae238badb))
- **octra:** octra doesn't load IO from task_use_ouputs_from_task attribute ([3cbbb00](https://github.com/IPS-LMU/octra/commit/3cbbb004fc7c5be0827c48641dc95ea16e72c378))

### Performance Improvements

- **ngx-components:** improved drawing algorithm of audio-viewer ([eab131d](https://github.com/IPS-LMU/octra/commit/eab131dc647b8c505b45a81164b26ffe6a656564))

## [0.1.12](https://github.com/IPS-LMU/octra/compare/annotation-0.1.11...annotation-0.1.12) (2024-02-28)

### Bug Fixes

- **annotation:** full name instead of name set on AnnotJSON on format import ([0419bd4](https://github.com/IPS-LMU/octra/commit/0419bd4a21079eb2dc5e4ea617680090f0fce919))

## [0.1.11](https://github.com/IPS-LMU/octra/compare/annotation-0.1.10...annotation-0.1.11) (2024-02-28)

### Bug Fixes

- **ngx-components:** placing boundary on transcribed segment removes transcript ([5fc3cb7](https://github.com/IPS-LMU/octra/commit/5fc3cb73528084a92430164483e52304d42887f8))
- **octra:** exported files with wrong naming ([2bd0540](https://github.com/IPS-LMU/octra/commit/2bd05403b3cc8e7c1f6d7e0b647e378f2aa1996d))

### Code Refactoring

- **annotation:** getLeftSibling() and getRightSibling() now uses index as parameter ([828b984](https://github.com/IPS-LMU/octra/commit/828b984a1acd9df5bd439f0c6a16737b4482933f))

### Features

- **annotation:** fix missing segment at the end of whisper json annotation ([91d6008](https://github.com/IPS-LMU/octra/commit/91d60083f839c1578f9fc4dc572416eac6fda0e3))
- **annotation:** new converter for WhisperJSON format ([ecc0038](https://github.com/IPS-LMU/octra/commit/ecc00383e6d3f44031440fb664c7880be131fb64))

### BREAKING CHANGES

- **annotation:** check your calls of getLeftSibling() and
  getRightSibling() and change parameters to index values.

## [0.1.10](https://github.com/IPS-LMU/octra/compare/annotation-0.1.9...annotation-0.1.10) (2023-11-24)

## [0.1.9](https://github.com/IPS-LMU/octra/compare/annotation-0.1.8...annotation-0.1.9) (2023-11-23)

## [0.1.8](https://github.com/IPS-LMU/octra/compare/annotation-0.1.7...annotation-0.1.8) (2023-11-23)

### Bug Fixes

- **octra:** combination f asr & word alignment not working correctly ([1948467](https://github.com/IPS-LMU/octra/commit/194846784ec000ec745ea0e20d4d3006009bd0e5))
- **octra:** fix several issues ([1c70c48](https://github.com/IPS-LMU/octra/commit/1c70c48d58351cae4adae18e632ef9746fcd69a1))
- **octra:** local mode not working ([67c3231](https://github.com/IPS-LMU/octra/commit/67c3231986a7be83bfcd2db787d455b2f576bfdd))
- **octra:** re-authentication not working correctly ([d8aef1e](https://github.com/IPS-LMU/octra/commit/d8aef1e3d1f54aa5f7049f6787a28c8d2296f0e1))
