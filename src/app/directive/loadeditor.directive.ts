import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appLoadeditor]'
})
export class LoadeditorDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
