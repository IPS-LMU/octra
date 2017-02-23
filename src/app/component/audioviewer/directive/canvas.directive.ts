import { Directive, ElementRef, Renderer } from '@angular/core';

@Directive({
	selector: '[canvasDir]'
})

export class AudioCanvasDirective {
	constructor(private elementRef:ElementRef, private renderer:Renderer) {
	}

}
