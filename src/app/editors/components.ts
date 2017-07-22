import {TwoDEditorComponent} from './2D-editor/2D-editor.component';
import {LinearEditorComponent} from './linear-editor/linear-editor.component';
import {EditorWSignaldisplayComponent} from './editor-without-signaldisplay/editor-w-signaldisplay.component';

export const EditorComponents = [
  {
    name: EditorWSignaldisplayComponent.editorname,
    editor: EditorWSignaldisplayComponent,
    translate: 'interfaces.simple editor',
    icon: '<span class="glyphicon glyphicon-minus navbar-icon"></span>'
  },
  {
    name: LinearEditorComponent.editorname,
    editor: LinearEditorComponent,
    translate: 'interfaces.linear editor',
    icon: '<span class="glyphicon glyphicon-modal-window navbar-icon">'
  },
  {
    name: TwoDEditorComponent.editorname,
    editor: TwoDEditorComponent,
    translate: 'interfaces.2D editor',
    icon: '<span class="glyphicon glyphicon-align-justify navbar-icon"></span>'
  }
];
