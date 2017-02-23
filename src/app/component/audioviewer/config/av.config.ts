export class AudioviewerConfig {
	public Settings: any = {
		multi_line         : false,
		pixel_per_sec      : 200, //only relevant for multiline
		justify_signal_height: false,
		cropping           : "none",
		height             : 150,
		backgroundcolor    : "rgb(248, 248, 248)",
		margin             : {
			top   : 0,
			right : 0,
			bottom: 10,
			left  : 0
		},
		cursor             : {
			color: "rgb(255, 0, 0)"
		},
		playcursor         : {
			height: 20,
			width : 10,
			color : "purple"
		},
		boundaries         : {
			enabled: true,
			readonly: false,
			width  : 3,
			color  : "rgb(160, 160, 0)"
		},
		grid               : {
			enabled: true,
			color: "rgb(224, 224, 224)"
		},
		data               : {
			color: "rgb(0, 127, 0)"
		},
		selection          : {
			enabled: true,
			color  : "gray"
		},
		frame             : {
			color: "rgb(0, 0, 0)"
		},
		//SHORTCUTS
		//SHORTCUTS sheme: KeyMapping [+ <char or charCode>]
		shortcuts_enabled  : true,
		shortcuts          : {
			play_pause    : {
				keys     : {
					mac: "TAB",
					pc : "TAB",
				},
				focusonly: false,
				title    : "Abspielen / Pausieren",
			},
			stop          : {
				keys     : {
					mac: "ESC",
					pc : "ESC"
				},
				focusonly: false,
				title    : "Wiedergabe beenden",
			},
			set_boundary  : {
				keys     : {
					mac: "S",
					pc : "S"
				},
				focusonly: true,
				title    : "Grenze setzen",
			},
			play_selection: {
				keys     : {
					mac: "C",
					pc : "C"
				},
				focusonly: true,
				title    : "Selektion abspielen",
			},
			step_backward : {
				keys     : {
					mac: "SHIFT + BACKSPACE",
					pc : "SHIFT + BACKSPACE"
				},
				focusonly: false,
				title    : "Zur zuletzt pausierten Stelle springen",
			},
			segment_enter : {
				keys     : {
					mac: "ENTER",
					pc : "ENTER"
				},
				focusonly: true,
				title    : "Segment transkribieren",
			},
			cursor_left   : {
				keys     : {
					mac: "ARROWLEFT",
					pc : "ARROWLEFT"
				},
				focusonly: true,
				title    : "Cursor nach links bewegen"
			},
			cursor_right  : {
				keys     : {
					mac: "ARROWRIGHT",
					pc : "ARROWRIGHT"
				},
				focusonly: true,
				title    : "Cursor nach rechts bewegen"
			}
		},
		disabled_keys      : [ "SHIFT + SPACE" ],
		timeline           : {
			enabled   : false,
			height    : 15,
			fontSize  : 9,
			fontWeight: "light",
			font      : "Arial",
			foreColor : "black"
		},
		step_width_ratio   : 0.0226
	}
		;

	constructor() {
	}
}
