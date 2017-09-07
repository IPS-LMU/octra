# Change Log

## [1.2.0](https://github.com/IPS-LMU/octra/tree/1.2.0) (2017-09-07)
[Full Changelog](https://github.com/IPS-LMU/octra/compare/v1.1.0...1.2.0)

**Implemented enhancements:**

- use new protocol specification for logging user actions [\#77](https://github.com/IPS-LMU/octra/issues/77)
- allow sending bug reports via email [\#76](https://github.com/IPS-LMU/octra/issues/76)
- allow more levels [\#75](https://github.com/IPS-LMU/octra/issues/75)
- use IndexedDB instead of LocalStorage [\#74](https://github.com/IPS-LMU/octra/issues/74)
- 2D-Editor: follow playcursor [\#70](https://github.com/IPS-LMU/octra/issues/70)
- allow importing raw text file [\#69](https://github.com/IPS-LMU/octra/issues/69)
- allow more audio formats than Wave format [\#67](https://github.com/IPS-LMU/octra/issues/67)
- better audio managing structure [\#66](https://github.com/IPS-LMU/octra/issues/66)
- 2D-Editor: change position of miniloupe [\#64](https://github.com/IPS-LMU/octra/issues/64)
- reorganize editor components [\#61](https://github.com/IPS-LMU/octra/issues/61)
- add popover to each button of audio-navigation component [\#60](https://github.com/IPS-LMU/octra/issues/60)
- allow setting boundaries in "editor without a signal display" [\#59](https://github.com/IPS-LMU/octra/issues/59)
- audio playback: step back n seconds and play audio d seconds [\#57](https://github.com/IPS-LMU/octra/issues/57)
- read annotation data that already exists in database [\#56](https://github.com/IPS-LMU/octra/issues/56)
- enable Copy & Paste in text editor [\#55](https://github.com/IPS-LMU/octra/issues/55)
- use annotJSON as OCTRAs representation of its annotation [\#54](https://github.com/IPS-LMU/octra/issues/54)
- enable bug report [\#53](https://github.com/IPS-LMU/octra/issues/53)
- play audio on hover [\#52](https://github.com/IPS-LMU/octra/issues/52)
- Overlay GUI: play audio after entering semgment [\#51](https://github.com/IPS-LMU/octra/issues/51)
- update dependencies [\#47](https://github.com/IPS-LMU/octra/issues/47)
- show additional informations [\#46](https://github.com/IPS-LMU/octra/issues/46)
- improve usability [\#44](https://github.com/IPS-LMU/octra/issues/44)
- enable login without job number [\#42](https://github.com/IPS-LMU/octra/issues/42)

**Fixed bugs:**

- Safari: can't decode audio file [\#73](https://github.com/IPS-LMU/octra/issues/73)
- boundaries in text: no popover after loading other language [\#72](https://github.com/IPS-LMU/octra/issues/72)
- mini-loupe: false zooming factor [\#71](https://github.com/IPS-LMU/octra/issues/71)
- prevent moving boundary over others [\#65](https://github.com/IPS-LMU/octra/issues/65)
- transcr-overview: whole text is underlined red when two errors come after each other [\#62](https://github.com/IPS-LMU/octra/issues/62)
- play cursor vanished after stopping at some positions [\#58](https://github.com/IPS-LMU/octra/issues/58)
- audioviewer: can't set boundary if playcursor is in another segment [\#50](https://github.com/IPS-LMU/octra/issues/50)
- transcr-window: scroll to parent positon doesn't work [\#49](https://github.com/IPS-LMU/octra/issues/49)
- if audio cannot be loaded user can't go back [\#48](https://github.com/IPS-LMU/octra/issues/48)
- false state: broken view [\#45](https://github.com/IPS-LMU/octra/issues/45)
- editor dissapears after switching to another one [\#43](https://github.com/IPS-LMU/octra/issues/43)

## [v1.1.0](https://github.com/IPS-LMU/octra/tree/v1.1.0) (2017-04-25)
[Full Changelog](https://github.com/IPS-LMU/octra/compare/v1.0.7...v1.1.0)

**Implemented enhancements:**

- show loading status and a hint that loading could take a while [\#41](https://github.com/IPS-LMU/octra/issues/41)
- Export guidelines.json to PDF [\#40](https://github.com/IPS-LMU/octra/issues/40)
- change structure of configuration files [\#37](https://github.com/IPS-LMU/octra/issues/37)
- enable configuration of the feedback form in project's configuration [\#36](https://github.com/IPS-LMU/octra/issues/36)
- improve usabilty [\#35](https://github.com/IPS-LMU/octra/issues/35)
- transcr-overview: click on a segment's number enables switching to the selected segment [\#25](https://github.com/IPS-LMU/octra/issues/25)

**Fixed bugs:**

- routing does not work properly [\#39](https://github.com/IPS-LMU/octra/issues/39)
- delete browser cache and login leads to failure loading guidelines [\#38](https://github.com/IPS-LMU/octra/issues/38)
- audioviewer: signal not drawn after reading short audio file \(\<2sec\) [\#20](https://github.com/IPS-LMU/octra/issues/20)

## [v1.0.7](https://github.com/IPS-LMU/octra/tree/v1.0.7) (2017-04-15)
[Full Changelog](https://github.com/IPS-LMU/octra/compare/v1.0.6...v1.0.7)

**Implemented enhancements:**

- online mode: login with user name, project name and jobnumber [\#33](https://github.com/IPS-LMU/octra/issues/33)
- marker symbols: automatically set alt attribute of images [\#32](https://github.com/IPS-LMU/octra/issues/32)
- transcr-overview: underline errors according to the guidelines [\#31](https://github.com/IPS-LMU/octra/issues/31)
- signal-gui: use one cricle loupe instance only [\#29](https://github.com/IPS-LMU/octra/issues/29)
- transcr-overview: underline errors in transcriptions and show description on hover  [\#28](https://github.com/IPS-LMU/octra/issues/28)
- transcr-guidelines: enable browsing through guidelines [\#24](https://github.com/IPS-LMU/octra/issues/24)
- move cursor to text's end faster after initialisation of a texteditor [\#22](https://github.com/IPS-LMU/octra/issues/22)
- upgrade @angular/cli to 1.0.0-rc.4 [\#21](https://github.com/IPS-LMU/octra/issues/21)
- 2D-Editor: extend signaldisplay if it's shorter than its parent's width [\#14](https://github.com/IPS-LMU/octra/issues/14)
- implement the possibility of creating distinc transcription guidelines und markers [\#6](https://github.com/IPS-LMU/octra/issues/6)
- apply the translation module to the whole default GUI [\#5](https://github.com/IPS-LMU/octra/issues/5)

**Fixed bugs:**

- Linear Editor: Signal isn't drawn correctly while resizing [\#27](https://github.com/IPS-LMU/octra/issues/27)
- Linear Editor: some keys are blocked while typing and the cursor is over the signaldisplay  [\#18](https://github.com/IPS-LMU/octra/issues/18)
- warning before user switches between local and online mode [\#16](https://github.com/IPS-LMU/octra/issues/16)

## [v1.0.6](https://github.com/IPS-LMU/octra/tree/v1.0.6) (2017-03-20)
[Full Changelog](https://github.com/IPS-LMU/octra/compare/v1.0.5...v1.0.6)

**Implemented enhancements:**

- angular-cli: update to 1.0.0rc2 [\#15](https://github.com/IPS-LMU/octra/issues/15)
- use ng-bootstrap package [\#12](https://github.com/IPS-LMU/octra/issues/12)

**Fixed bugs:**

- audioviewer: adjusting height of drawn signal to the max height doesn't work [\#19](https://github.com/IPS-LMU/octra/issues/19)
- after switching from transcription-submit to transcription component saving data does not work [\#17](https://github.com/IPS-LMU/octra/issues/17)

## [v1.0.5](https://github.com/IPS-LMU/octra/tree/v1.0.5) (2017-03-16)
[Full Changelog](https://github.com/IPS-LMU/octra/compare/v1.0.4...v1.0.5)

**Implemented enhancements:**

- show icon that displays OCTRA is saving now. [\#10](https://github.com/IPS-LMU/octra/issues/10)
- add list of supported languages in config.json [\#9](https://github.com/IPS-LMU/octra/issues/9)
- tool-bar: set glyphicons and apply responsive design [\#8](https://github.com/IPS-LMU/octra/issues/8)
- upgrade angular-cli version to 1.0.0-rc.1 [\#7](https://github.com/IPS-LMU/octra/issues/7)

**Fixed bugs:**

- reload-file.component: allow valid file formats only [\#13](https://github.com/IPS-LMU/octra/issues/13)
- exported file name does not contain the complete name of the original file [\#11](https://github.com/IPS-LMU/octra/issues/11)
- language selection not visible after new session [\#4](https://github.com/IPS-LMU/octra/issues/4)

## [v1.0.4](https://github.com/IPS-LMU/octra/tree/v1.0.4) (2017-03-08)
**Implemented enhancements:**

- define allowed login IDs in separate JSON file [\#1](https://github.com/IPS-LMU/octra/issues/1)

**Fixed bugs:**

- audioplayer-gui: slider changes the current playpositon on resize [\#3](https://github.com/IPS-LMU/octra/issues/3)
- logging user interactions is unstable [\#2](https://github.com/IPS-LMU/octra/issues/2)



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*