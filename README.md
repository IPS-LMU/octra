# OCTRA

This is a web-application for the orthographic transcription of longer
audiofiles. It uses three editors for the orthographic transcription:

* Editor without signaldisplay: An typical, easy-to-use editor with just a texteditor and an audioplayer.
* Linear-Editor: This editor shows two signaldisplays: One for the whole view of the signal and one as loupe. You can set boundaries and define segments.
* 2D-Editor: This editor breaks the whole view of the signal to pieces and shows the pieces as lines one after one. Here you can set boundaries und define segments too.

One special feature of OCTRA is that it saves your proceedings automatically in your browser. If the browser is closed (abruptly) you can continue your transcription without data-loss.

## Remarks
At the moment, OCTRA can only be used locally. Please notice that OCTRA is still in development and could be buggy.

## Production Use
In a production environment you don't need to install OCTRA. Just copy the content of the ``dist`` folder to your http-server.

## Installation (Development Use)
On the Development level OCTRA requires Node 6.9.0 or higher, together with NPM 3 or higher.

Then you can install OCTRA:

1. Go to your octra directory via Terminal (or GitBash on Windows)
2. Call `` npm install ``
3. Wait.
4. Duplicate the file ``src/app/app.config.sample.ts`` and rename it to ``src/app/app.config.ts``. In app.config.ts you can change the settings of your instance of OCTRA.
5. After the installation you can call `` npm start `` to start the node server.

## Used third-party packages:
* angular-cli: https://github.com/angular/angular-cli
* summernote: https://github.com/summernote/summernote
* bootstrap: http://getbootstrap.com/
* bootstrap-material-design: http://fezvrasta.github.io/bootstrap-material-design/
* ng2-webstorage: https://github.com/PillowPillow/ng2-webstorage
* browser-signal-processing: https://www.npmjs.com/package/browser-signal-processing
* ng2-bs3-modal: https://github.com/dougludlow/ng2-bs3-modal
* platform: https://github.com/bestiejs/platform.js/