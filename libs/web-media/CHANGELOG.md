# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

# [0.1.0](https://github.com/IPS-LMU/octra/compare/web-media-0.0.11...web-media-0.1.0) (2024-11-08)


### Bug Fixes

* **audio:** audio playback doesn't start at exact position ([3864696](https://github.com/IPS-LMU/octra/commit/3864696296a70c8fc4bd7c9bee768ff8a781a4c4))
* **octra:** can't import files one after the other on dropzone ([76a32f2](https://github.com/IPS-LMU/octra/commit/76a32f268588a5bc60f119c8b5e3eb56a65332a7))
* **octra:** detail window does not load on navigation ([9b0b366](https://github.com/IPS-LMU/octra/commit/9b0b366d86323668ffae70a7e735ce1703e0a7c1))
* **octra:** url mode sometimes does not load ([bcd4baa](https://github.com/IPS-LMU/octra/commit/bcd4baae17a57ed6ae2271266eb535770a716909))
* **octra:** word alignment on unit does not have correct boundaries ([30445ba](https://github.com/IPS-LMU/octra/commit/30445ba1892b71bf1e259905e5e9a08a57106c6c))
* **web-media:** audio context can't be closed twice ([ca5b4a3](https://github.com/IPS-LMU/octra/commit/ca5b4a3c626001a88637e51b27a0fb82bdd51bfc))
* **web-media:** audio.pause before audio play abort error ([62ad842](https://github.com/IPS-LMU/octra/commit/62ad8426359e5cc43fb4476549d91b971bd472cc))


### Features

* **octra:** support for .mp3, .flac, .m4a audio files ([c3fb966](https://github.com/IPS-LMU/octra/commit/c3fb9667b8f83aba8a8bd6da52382a5b00c01f71))



## [0.0.11](https://github.com/IPS-LMU/octra/compare/web-media-0.0.10...web-media-0.0.11) (2024-02-17)


### Bug Fixes

* **octra:** exported files with wrong naming ([2bd0540](https://github.com/IPS-LMU/octra/commit/2bd05403b3cc8e7c1f6d7e0b647e378f2aa1996d))
* **octra:** logger.map function not found, extract full name without extension ([1bceed3](https://github.com/IPS-LMU/octra/commit/1bceed3e2755e91e78c4c95ad3f8cd098c09fdfd))



## [0.0.10](https://github.com/IPS-LMU/octra/compare/web-media-0.0.9...web-media-0.0.10) (2024-01-16)


### Bug Fixes

* **octra:** word alignment only not working ([6d59c8f](https://github.com/IPS-LMU/octra/commit/6d59c8f0c4b06902fe24741eb61a45a0028ac571))


### Code Refactoring

* **web-media:** use extractFileNameFromURL function from utilities library ([7ba0a1c](https://github.com/IPS-LMU/octra/commit/7ba0a1cd91d6eada9391a3fab6667613821088d9))


### BREAKING CHANGES

* **web-media:** needs @octra/utilities >= 0.0.11



## [0.0.9](https://github.com/IPS-LMU/octra/compare/web-media-0.0.8...web-media-0.0.9) (2024-01-09)


### Bug Fixes

* **web-media:** FileInfo.fromURL() doesn't parse file name correctly. ([614f5b1](https://github.com/IPS-LMU/octra/commit/614f5b11db3e97575809a6998f9f3769420ba509))



## [0.0.8](https://github.com/IPS-LMU/octra/compare/web-media-0.0.7...web-media-0.0.8) (2023-11-24)



## [0.0.7](https://github.com/IPS-LMU/octra/compare/web-media-0.0.6...web-media-0.0.7) (2023-11-23)


### Bug Fixes

* **octra:** guidelines search icon misplaced, replace not working PDF feature with just URL ([3e0390e](https://github.com/IPS-LMU/octra/commit/3e0390e4d8373c72774f862f46c618ac53404f09))


### Features

* **octra:** additional params audio_url, audio_name and readonly for URL mode ([6cf1264](https://github.com/IPS-LMU/octra/commit/6cf12649a7d1c987e522ede4719104876842111e))
