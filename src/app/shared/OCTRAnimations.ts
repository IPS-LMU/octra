import { AnimationMetadata, AnimationEntryMetadata, trigger, state, style, transition, animate } from "@angular/core";
import { type } from "os";

export const OCTRANIMATIONS: AnimationEntryMetadata[] = [
	trigger('fadeToggle', [
		state('inactive', style({
			display: "none",
			opacity: "0.0"
		})),
		state('active', style({
			display: "inherit",
			opacity: "1.0"
		})),
		transition('inactive => active', animate('300ms ease-in')),
		transition('active => inactive', animate('300ms ease-in'))
	])
];