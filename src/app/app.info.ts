import {Converter} from './core/obj/Converters/Converter';
import {TextConverter} from './core/obj/Converters/TextConverter';
import {AnnotJSONConverter} from './core/obj/Converters/AnnotJSONConverter';
import {PraatTableConverter} from './core/obj/Converters/PraatTableConverter';
import {CTMConverter} from './core/obj/Converters/CTMConverter';
import {Component} from '@angular/core';
import {TwoDEditorComponent} from './editors/2D-editor/2D-editor.component';
import {EditorWSignaldisplayComponent} from './editors/editor-without-signaldisplay/editor-w-signaldisplay.component';
import {LinearEditorComponent} from './editors/linear-editor/linear-editor.component';
import {PraatTextgridConverter} from './core/obj/Converters/PraatTextgridConverter';

export const EDITORS: any[] = [
  EditorWSignaldisplayComponent,
  TwoDEditorComponent,
  LinearEditorComponent
];

export class AppInfo {
  public static get editors(): { name: string; editor: Component }[] {
    return this._editors;
  }

  public static get converters(): Converter[] {
    return this._converters;
  }

  static get version(): string {
    return this._version;
  }

  private static _version = '1.2.0';


  // defined editors
  private static _editors: {
    name: string,
    editor: Component,
    translate: string,
    icon: string
  }[] = [
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

  // defined converters
  private static _converters: Converter[] = [
    new TextConverter(),
    new PraatTableConverter(),
    new PraatTextgridConverter(),
    new AnnotJSONConverter(),
    new CTMConverter()
  ];
}
