# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [0.1.2](https://github.com/IPS-LMU/octra/compare/ngx-components-0.1.1...ngx-components-0.1.2) (2024-08-07)


### Bug Fixes

* **annotation:** speaker pattern matching not working with SRT converter ([e92e72b](https://github.com/IPS-LMU/octra/commit/e92e72b6ad38258d1717fdb4225d9cfbce964eb0))


### Features

* **octra:** gear icon next to file name allows to change import options ([32afe7b](https://github.com/IPS-LMU/octra/commit/32afe7b3af1c2b8825115dc00c58ad25153b0f6f))



## [0.1.1](https://github.com/IPS-LMU/octra/compare/ngx-components-0.1.0...ngx-components-0.1.1) (2024-07-29)


### Bug Fixes

* **audio:** audio playback doesn't start at exact position ([3864696](https://github.com/IPS-LMU/octra/commit/3864696296a70c8fc4bd7c9bee768ff8a781a4c4))
* **ngx-components:** boundaries not updated after switching levels ([d0acbc6](https://github.com/IPS-LMU/octra/commit/d0acbc6de142285097e2661953249c3436b34ab6))
* **ngx-components:** boundaries visible in audio signal from other level ([1052b4e](https://github.com/IPS-LMU/octra/commit/1052b4ee7b0a6f08cb004bfd2a1af616e3e42613))
* **ngx-components:** switching between annotation levels leads to malfunctions in audio-viewer ([09ff3f8](https://github.com/IPS-LMU/octra/commit/09ff3f8151aee701899411164629240a4d97c278))
* **octra:** new options toggleable and dependsOn for form-generator ([588bf77](https://github.com/IPS-LMU/octra/commit/588bf779a37be776bc3bb93f5a9860ed725db250))


### Features

* **octra:** new settings section with asr options included ([b64fb15](https://github.com/IPS-LMU/octra/commit/b64fb15e282411137787f2abd03c2468686a6e3a))
* **octra:** SRT import with special import options ([8bd4111](https://github.com/IPS-LMU/octra/commit/8bd4111373784735ad0b7d19be016a908afea060))



# [0.1.0](https://github.com/IPS-LMU/octra/compare/ngx-components-0.0.8...ngx-components-0.1.0) (2024-03-25)


### Bug Fixes

* **ngx-components:** audio viewer does not draw segment rectangles ([509e207](https://github.com/IPS-LMU/octra/commit/509e207913ef602813b9db020c2f651fd897f357))
* **ngx-components:** audio-viewer does not resize properly ([ac19481](https://github.com/IPS-LMU/octra/commit/ac1948190c6787e9f8f63a8c57529ec1a0af60d3))
* **ngx-components:** placing boundary on transcribed segment removes transcript ([5fc3cb7](https://github.com/IPS-LMU/octra/commit/5fc3cb73528084a92430164483e52304d42887f8))
* **ngx-components:** resizing does not work on audio-viewer ([45e4a6f](https://github.com/IPS-LMU/octra/commit/45e4a6fcb19b79db5babd42da3fab983e819f53e))
* **ngx-components:** slow audio viewer ([d8e36fa](https://github.com/IPS-LMU/octra/commit/d8e36fa002b1d295b5cccc1dcd08c2fae238badb))
* **octra:** 2D-Editor switching between segments in detail window sometimes not working ([dc79496](https://github.com/IPS-LMU/octra/commit/dc7949691162d64a793497eb3621e9b38c2b996f))
* **octra:** resizing does not draw signal and grid ([4a5b2fb](https://github.com/IPS-LMU/octra/commit/4a5b2fb20d5045c53c69457a6a7a96bcfd302087))
* **octra:** selection not working after resize ([6bb216d](https://github.com/IPS-LMU/octra/commit/6bb216d3b32ea3fbdf437829ec40137cefd18e64))
* **octra:** single-line audioviewer does not show correct background color ([027aa79](https://github.com/IPS-LMU/octra/commit/027aa7996d8ba1d4904b8fc9651f071cdf3a44d4))
* **web-components:** demo not working ([2080869](https://github.com/IPS-LMU/octra/commit/2080869267e90b6a07468f48d5afd0f6771ab4c1))


### Performance Improvements

* **ngx-components:** improved drawing algorithm of audio-viewer ([eab131d](https://github.com/IPS-LMU/octra/commit/eab131dc647b8c505b45a81164b26ffe6a656564))



## [0.0.8](https://github.com/IPS-LMU/octra/compare/ngx-components-0.0.7...ngx-components-0.0.8) (2024-01-15)


### Bug Fixes

* **ngx-components:** audio viewer does not draw on bigger audio files ([1e896f5](https://github.com/IPS-LMU/octra/commit/1e896f59b189ed85238714695c5fea6d6db9f9d6))
* **ngx-components:** invisible selection in audio-viewer component ([b880117](https://github.com/IPS-LMU/octra/commit/b8801179dbc20745fdc610585da53435942ce09c))



## [0.0.7](https://github.com/IPS-LMU/octra/compare/ngx-components-0.0.6...ngx-components-0.0.7) (2024-01-11)


### Performance Improvements

* **ngx-components:** audioviewer now uses caching from konva.js ([2e8a410](https://github.com/IPS-LMU/octra/commit/2e8a410d9366df2dd719913e09f9ca8190908e9f))



## [0.0.6](https://github.com/IPS-LMU/octra/compare/ngx-components-0.0.5...ngx-components-0.0.6) (2023-11-23)


### Bug Fixes

* **octra:** setting silence using "A" key not working ([19573a2](https://github.com/IPS-LMU/octra/commit/19573a228f0d228266ab87113d0aa4b6d604d843))
* **octra:** text caret not logged correctly, rename to textSelection ([0945c47](https://github.com/IPS-LMU/octra/commit/0945c476801fdb32dc705914187de0e4c251d5be))


### Features

* **octra:** dynamically move transcription units ([0af071e](https://github.com/IPS-LMU/octra/commit/0af071e4f399411160c8925a5e458a673f176d92))
