import {TwoDEditorComponent} from './2D-editor/2D-editor.component';
import {LinearEditorComponent} from './linear-editor/linear-editor.component';
import {EditorWSignaldisplayComponent} from './editor-without-signaldisplay/editor-w-signaldisplay.component';

export const EditorComponents = [
  {
    name: EditorWSignaldisplayComponent.editorname,
    editor: EditorWSignaldisplayComponent,
    translate: 'interfaces.simple editor',
    icon: 'minus'
  },
  {
    name: LinearEditorComponent.editorname,
    editor: LinearEditorComponent,
    translate: 'interfaces.linear editor',
    icon: 'window-maximize'
  },
  {
    name: TwoDEditorComponent.editorname,
    editor: TwoDEditorComponent,
    translate: 'interfaces.2D editor',
    icon: 'align-justify'
  }
];
