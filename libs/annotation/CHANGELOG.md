# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [0.1.14](https://github.com/IPS-LMU/octra/compare/annotation-0.1.13...annotation-0.1.14) (2024-07-29)


### Bug Fixes

* **annotation:** srt import doesn't combine units of same speaker correctly ([2f41036](https://github.com/IPS-LMU/octra/commit/2f41036a90eb756872ccc4118729f989c9910243))
* **octra:** overview can not be opened after srt import ([679fec1](https://github.com/IPS-LMU/octra/commit/679fec11d298a2998d584ed83c82fed83059f242))
* **octra:** url mode loads wrong data if logged-in in other tab ([efaa5ad](https://github.com/IPS-LMU/octra/commit/efaa5ad3fe64308f78363fd078a8d214663912a3))


### Features

* **octra:** new query param for url mode "aType" for export type ([69a9fa1](https://github.com/IPS-LMU/octra/commit/69a9fa15314e5bc304d73010693559dc605aa405))
* **octra:** SRT import with special import options ([8bd4111](https://github.com/IPS-LMU/octra/commit/8bd4111373784735ad0b7d19be016a908afea060))



## [0.1.13](https://github.com/IPS-LMU/octra/compare/annotation-0.1.12...annotation-0.1.13) (2024-03-25)


### Bug Fixes

* **annotation:** importing ELAN file fails on unknown attributes ([745a67f](https://github.com/IPS-LMU/octra/commit/745a67f356f2188b64634726c3a761e32b51134f))
* **ngx-components:** slow audio viewer ([d8e36fa](https://github.com/IPS-LMU/octra/commit/d8e36fa002b1d295b5cccc1dcd08c2fae238badb))
* **octra:** octra doesn't load IO from task_use_ouputs_from_task attribute ([3cbbb00](https://github.com/IPS-LMU/octra/commit/3cbbb004fc7c5be0827c48641dc95ea16e72c378))


### Performance Improvements

* **ngx-components:** improved drawing algorithm of audio-viewer ([eab131d](https://github.com/IPS-LMU/octra/commit/eab131dc647b8c505b45a81164b26ffe6a656564))



## [0.1.12](https://github.com/IPS-LMU/octra/compare/annotation-0.1.11...annotation-0.1.12) (2024-02-28)


### Bug Fixes

* **annotation:** full name instead of name set on AnnotJSON on format import ([0419bd4](https://github.com/IPS-LMU/octra/commit/0419bd4a21079eb2dc5e4ea617680090f0fce919))



## [0.1.11](https://github.com/IPS-LMU/octra/compare/annotation-0.1.10...annotation-0.1.11) (2024-02-28)


### Bug Fixes

* **ngx-components:** placing boundary on transcribed segment removes transcript ([5fc3cb7](https://github.com/IPS-LMU/octra/commit/5fc3cb73528084a92430164483e52304d42887f8))
* **octra:** exported files with wrong naming ([2bd0540](https://github.com/IPS-LMU/octra/commit/2bd05403b3cc8e7c1f6d7e0b647e378f2aa1996d))


### Code Refactoring

* **annotation:** getLeftSibling() and getRightSibling() now uses index as parameter ([828b984](https://github.com/IPS-LMU/octra/commit/828b984a1acd9df5bd439f0c6a16737b4482933f))


### Features

* **annotation:** fix missing segment at the end of whisper json annotation ([91d6008](https://github.com/IPS-LMU/octra/commit/91d60083f839c1578f9fc4dc572416eac6fda0e3))
* **annotation:** new converter for WhisperJSON format ([ecc0038](https://github.com/IPS-LMU/octra/commit/ecc00383e6d3f44031440fb664c7880be131fb64))


### BREAKING CHANGES

* **annotation:** check your calls of getLeftSibling() and
getRightSibling() and change parameters to index values.



## [0.1.10](https://github.com/IPS-LMU/octra/compare/annotation-0.1.9...annotation-0.1.10) (2023-11-24)



## [0.1.9](https://github.com/IPS-LMU/octra/compare/annotation-0.1.8...annotation-0.1.9) (2023-11-23)



## [0.1.8](https://github.com/IPS-LMU/octra/compare/annotation-0.1.7...annotation-0.1.8) (2023-11-23)


### Bug Fixes

* **octra:** combination f asr & word alignment not working correctly ([1948467](https://github.com/IPS-LMU/octra/commit/194846784ec000ec745ea0e20d4d3006009bd0e5))
* **octra:** fix several issues ([1c70c48](https://github.com/IPS-LMU/octra/commit/1c70c48d58351cae4adae18e632ef9746fcd69a1))
* **octra:** local mode not working ([67c3231](https://github.com/IPS-LMU/octra/commit/67c3231986a7be83bfcd2db787d455b2f576bfdd))
* **octra:** re-authentication not working correctly ([d8aef1e](https://github.com/IPS-LMU/octra/commit/d8aef1e3d1f54aa5f7049f6787a28c8d2296f0e1))
