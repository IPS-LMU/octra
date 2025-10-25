# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

# [1.2.0](https://github.com/IPS-LMU/octra/compare/web-media-1.1.0...web-media-1.2.0) (2025-10-25)


### Features

* **web-media:** add online property to serialized FileInfo ([6cbec27](https://github.com/IPS-LMU/octra/commit/6cbec27cd7ac5adcf977e72aa7c1d3ef15453c30))



# [1.1.0](https://github.com/IPS-LMU/octra/compare/web-media-1.0.1...web-media-1.1.0) (2025-10-13)


### Features

* **web-media:** add type FileInfoSerialized ([f17b790](https://github.com/IPS-LMU/octra/commit/f17b790ade62260c4093f26829bf6ea3c0124c9c))



## [1.0.1](https://github.com/IPS-LMU/octra/compare/web-media-1.0.0...web-media-1.0.1) (2025-04-24)



# [1.0.0](https://github.com/IPS-LMU/octra/compare/web-media-0.1.2...web-media-1.0.0) (2025-01-13)

### Bug Fixes

- **octra:** transcr-overview shows wrong errors ([2b97a97](https://github.com/IPS-LMU/octra/commit/2b97a976e2156b265b1661369e6ccaf6f90d5e3d))
- **web-media:** splitting audio files not working ([f6e58d1](https://github.com/IPS-LMU/octra/commit/f6e58d1d0ab6279f13b86ad9bd67db7a3281099c))

### Features

- **octra:** upgrade to Nx 20 incl. Angular 19 ([5850cbc](https://github.com/IPS-LMU/octra/commit/5850cbcb71a6664ca53e9a038443e913390910c3))

## [0.1.2](https://github.com/IPS-LMU/octra/compare/web-media-0.1.1...web-media-0.1.2) (2024-11-18)

## [0.1.1](https://github.com/IPS-LMU/octra/compare/web-media-0.1.0...web-media-0.1.1) (2024-11-18)

### Bug Fixes

- **octra:** audiocutter configurator not working properly ([dcef0b2](https://github.com/IPS-LMU/octra/commit/dcef0b24719eaff53ad1a0620fc6cb3cb87cdc8e))
- **web-media:** audio parsers not loaded ([8d9db39](https://github.com/IPS-LMU/octra/commit/8d9db39bc8039a76b3719433ed9190cc3be45a34))
- **web-media:** cutting audio does not work correctly ([05a9658](https://github.com/IPS-LMU/octra/commit/05a965874dd7785f311ef7f41f194daec1f0c09b))
- **web-media:** cutting audio is not async ([667adaf](https://github.com/IPS-LMU/octra/commit/667adaf84cf9885e095c736120d122403fc47d70))

### Features

- **utilities:** moved TsWorker classed to utilities package ([5ba6838](https://github.com/IPS-LMU/octra/commit/5ba68383aafa88cf9077f83e09cfdeff541fa66a))

# [0.1.0](https://github.com/IPS-LMU/octra/compare/web-media-0.0.11...web-media-0.1.0) (2024-11-08)

### Bug Fixes

- **audio:** audio playback doesn't start at exact position ([3864696](https://github.com/IPS-LMU/octra/commit/3864696296a70c8fc4bd7c9bee768ff8a781a4c4))
- **octra:** can't import files one after the other on dropzone ([76a32f2](https://github.com/IPS-LMU/octra/commit/76a32f268588a5bc60f119c8b5e3eb56a65332a7))
- **octra:** detail window does not load on navigation ([9b0b366](https://github.com/IPS-LMU/octra/commit/9b0b366d86323668ffae70a7e735ce1703e0a7c1))
- **octra:** url mode sometimes does not load ([bcd4baa](https://github.com/IPS-LMU/octra/commit/bcd4baae17a57ed6ae2271266eb535770a716909))
- **octra:** word alignment on unit does not have correct boundaries ([30445ba](https://github.com/IPS-LMU/octra/commit/30445ba1892b71bf1e259905e5e9a08a57106c6c))
- **web-media:** audio context can't be closed twice ([ca5b4a3](https://github.com/IPS-LMU/octra/commit/ca5b4a3c626001a88637e51b27a0fb82bdd51bfc))
- **web-media:** audio.pause before audio play abort error ([62ad842](https://github.com/IPS-LMU/octra/commit/62ad8426359e5cc43fb4476549d91b971bd472cc))

### Features

- **octra:** support for .mp3, .flac, .m4a audio files ([c3fb966](https://github.com/IPS-LMU/octra/commit/c3fb9667b8f83aba8a8bd6da52382a5b00c01f71))

## [0.0.11](https://github.com/IPS-LMU/octra/compare/web-media-0.0.10...web-media-0.0.11) (2024-02-17)

### Bug Fixes

- **octra:** exported files with wrong naming ([2bd0540](https://github.com/IPS-LMU/octra/commit/2bd05403b3cc8e7c1f6d7e0b647e378f2aa1996d))
- **octra:** logger.map function not found, extract full name without extension ([1bceed3](https://github.com/IPS-LMU/octra/commit/1bceed3e2755e91e78c4c95ad3f8cd098c09fdfd))

## [0.0.10](https://github.com/IPS-LMU/octra/compare/web-media-0.0.9...web-media-0.0.10) (2024-01-16)

### Bug Fixes

- **octra:** word alignment only not working ([6d59c8f](https://github.com/IPS-LMU/octra/commit/6d59c8f0c4b06902fe24741eb61a45a0028ac571))

### Code Refactoring

- **web-media:** use extractFileNameFromURL function from utilities library ([7ba0a1c](https://github.com/IPS-LMU/octra/commit/7ba0a1cd91d6eada9391a3fab6667613821088d9))

### BREAKING CHANGES

- **web-media:** needs @octra/utilities >= 0.0.11

## [0.0.9](https://github.com/IPS-LMU/octra/compare/web-media-0.0.8...web-media-0.0.9) (2024-01-09)

### Bug Fixes

- **web-media:** FileInfo.fromURL() doesn't parse file name correctly. ([614f5b1](https://github.com/IPS-LMU/octra/commit/614f5b11db3e97575809a6998f9f3769420ba509))

## [0.0.8](https://github.com/IPS-LMU/octra/compare/web-media-0.0.7...web-media-0.0.8) (2023-11-24)

## [0.0.7](https://github.com/IPS-LMU/octra/compare/web-media-0.0.6...web-media-0.0.7) (2023-11-23)

### Bug Fixes

- **octra:** guidelines search icon misplaced, replace not working PDF feature with just URL ([3e0390e](https://github.com/IPS-LMU/octra/commit/3e0390e4d8373c72774f862f46c618ac53404f09))

### Features

- **octra:** additional params audio_url, audio_name and readonly for URL mode ([6cf1264](https://github.com/IPS-LMU/octra/commit/6cf12649a7d1c987e522ede4719104876842111e))
