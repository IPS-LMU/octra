import { Directive, inject, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[octraLoadeditor]' })
export class LoadeditorDirective {
  viewContainerRef = inject(ViewContainerRef);
}
