<h1 align="center">OCTRA v1.2</h1>

<p align="center">
  <img width="250" height="250" src="https://www.phonetik.uni-muenchen.de/apps/octra/contents/1.2/img/features/editor3.png" alt="2D-Editor">
  <img width="250" height="250" src="https://www.phonetik.uni-muenchen.de/apps/octra/contents/1.2/img/features/editor1.png" alt="Dictaphone Editor">
  <img width="250" height="250" src="https://www.phonetik.uni-muenchen.de/apps/octra/contents/1.2/img/features/editor2.png" alt="Linear Editor">
</p>

This is a web-application for the orthographic transcription of longer
audiofiles. For now, it uses three editors for the orthographic transcription:

* Editor without signaldisplay: An typical, easy-to-use editor with just a texteditor and an audioplayer.
* Linear-Editor: This editor shows two signaldisplays: One for the whole view of the signal and one as loupe. You can set boundaries and define segments.
* 2D-Editor: This editor breaks the whole view of the signal to pieces and shows the pieces as lines one after one. Here you can set boundaries und define segments too.

One special feature of OCTRA is that it saves your proceedings automatically in your browser. If the browser is closed (abruptly) you can continue your transcription without data-loss.


## Remarks
At the moment, OCTRA's online mode supports only one specific server database. That means, if you install OCTRA on your server, you can only use the local mode. We are working on supporting other servers.


## Production Use

### OCTRA website

If you don't want to install OCTRA, you can use the latest release [here](https://www.phonetik.uni-muenchen.de/apps/octra/octra/).

### Installation
In a production environment you don't need to compile OCTRA again.

1. Download the latest release from the releases page.``

2. Copy the content of the ``dist`` folder to your http-server. If you have already installed an older version of OCTRA, please notice to not override the old config folder. More information about upgrading can be found in the next section.

3. Before you can use OCTRA, duplicate and rename the `appconfig_sample.json` to `appconfig.json` in the config folder. Please make sure, that you offer all translation files for any language you defined in config.json.

4. To make OCTRA work please change the 'database:name' entry in your appconfig.json. After the first launch a new local database with this name will be created.

5. Please have a look on the projectconfig.json in the localmode folder. In this file you can change the settings of the local mode.

6. Change the baseref attribute in the index.html according to the url where your OCTRA installation is hosted.

7. Test if OCTRA works and check the webconsole if all works fine. If there are no errors you can use OCTRA.

### Upgrade

1. Duplicate and rename your octra directory (e.g. to 'octra_backup') on your server.

2. Download the new OCTRA release and upload the 'dist' folder to your server next to the backup and rename it to the same name like before (e.g. 'octra').

3. Copy your old appconfig.json and localmode folder to the new config directory.

4. Compare your appconfig.json with the new appconfig_samples.json file. If there are new entries, just copy and paste them to your appconfig.

5. Compare your projectconfig.json file with the new projectconfig.json file in the localmode folder.

6. Change the baseref attribute in the index.html according to the url where your OCTRA installation is hosted.

7. Test if OCTRA works and check the webconsole if all works fine. If there are no errors you can use OCTRA.


## Development Use
On the Development level OCTRA requires Node 6.9.0 or higher, together with NPM 3 or higher.

Then you can install OCTRA:

1. Clone the octra repository.
2. Go to the octra directory via Terminal (or GitBash on Windows).
3. Call `` npm install ``.
4. Wait.
5. Duplicate the file ``src/config/appconfig_sample.json`` and rename it to ``scr/config/appconfig.json``. In appconfig.json you can change the settings of your instance of OCTRA.
6. After the installation you can call `` npm start `` to start the node server.
7. After that please read the notice about the config files in the production use section


## Documentation

You can find a detailed documentation on OCTRA's configuration files [here](https://github.com/IPS-LMU/octra/wiki).


## Translation
To translate OCTRA to a new language you need to create these new files:

* i18n/octra/octra_<language code>.json
* config/localmode/guidelines/guidelines_<language code>.json

The easiest way to translate to a new language is to duplicate e.g. english files and overwrite their contents with the new translations. __Please translate the right side only__:

For example (Translation English -> German):

English:

```
[...]
"continue": "continue"
[...]
```

German:

```
[...]
"continue": "weiter"
[...]
```


### Affiliations
[INSTITUTE OF PHONETICS AND SPEECH PROCESSING](http://www.en.phonetik.uni-muenchen.de/)

#### Used third-party packages:
* angular-cli: https://github.com/angular/angular-cli
* summernote: https://github.com/summernote/summernote
* bootstrap: http://getbootstrap.com/
* bootstrap-material-design: http://fezvrasta.github.io/bootstrap-material-design/
* glyphicons (in bootstrap package): http://glyphicons.com/
* ng2-webstorage: https://github.com/PillowPillow/ng2-webstorage
* browser-signal-processing: https://www.npmjs.com/package/browser-signal-processing
* ng2-bs3-modal: https://github.com/dougludlow/ng2-bs3-modal
* platform: https://github.com/bestiejs/platform.js/
