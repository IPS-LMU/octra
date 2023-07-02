# How to create new Editors

OCTRA supports creating new editors. This tutorial explains how to do it.

1. Go to the Terminal and go to directory src/app/editors
2. Duplicate the folder new-editor and rename as you need. You need to rename the folder and its files, the class name and the "@Component" Decorator.
3. Change the attribute editorname in to the name of the new editor.
4. Add the new editor to scr/app/editors/components.ts. You can duplicate another item and change it.
   For the newly created editor you need an entry in the translation files. Insert a new entry in `./i18n/octra_.json`
5. Add the new Editor to app.module.ts in the array EDITORS.
6. To show the newly created editor you have to add it to the interfaces array in the project.config
7. After you have reloaded OCTRA it should show the newly created editor in the navbar. When you click on it the editor is loaded.
