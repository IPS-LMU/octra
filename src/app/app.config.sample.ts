export class APP_CONFIG {
	/* DEFAULT APPLICATION SETTINGS */
	/* Please copy this file and rename it to app.config.ts */

	public static get Settings(): any {
		return {
			//AUDIO SERVER SETTINGS
			AUDIO_SERVER       : "", //server api url
			//LOGGING
			LOGGING: true,
			RESPONSIVE: true,
			//BROWSER COMPATIBILITY
			ALLOWED_BROWSERS   : [
				{
					name       : "Chrome"
				}
			],
			DISALLOWED_BROWSERS: [],

			//MARKERS
			WRAP               : "[]",
			MARKERS            : [
				{
					name       : "truncation marker start",
					code       : "~abc",
					icon_url   : "assets/img/components/transcr-editor/default_markers/truncation_start.png",
					button_text: "~abc",     //title of text
					description: "Diesen Marker nur am Anfang setzen, sollte die Audiosequenz mit einem abgeschnittenem Wort beginnen",
					shortcut   : {
						mac: "ALT + 1",
						pc : "ALT + 1"
					},
					use_wrap : true
				},
				{
					name       : "filled pause",
					code       : "fil",
					icon_url   : "assets/img/components/transcr-editor/default_markers/fil.png",
					button_text: "filled pause",     //title of text
					description: "Für Zögern des Sprechers wie hm, ähm, äh und andere.",
					shortcut   : {
						mac: "ALT + 2",
						pc : "ALT + 2"
					},
					use_wrap : true
				},
				{
					name       : "intermittent noise",
					code       : "int",
					icon_url   : "assets/img/components/transcr-editor/default_markers/int.png",
					button_text: "intermittent noise",     //title of text
					description: "Für kurzes, eindeutiges Geräusch wie z.B. Türknallen, das Berühren des Mirkrofons, oder ähnliches.",
					shortcut   : {
						mac: "ALT + 3",
						pc : "ALT + 3"
					},
					use_wrap : true
				},
				{
					name       : "speaker noise",
					code       : "spk",
					icon_url   : "assets/img/components/transcr-editor/default_markers/spk.png",
					button_text: "speaker noise",     //title of text
					description: "Für Geräusche und Unterbrechungen, die der Sprecher produziert wie z.B. lautes Atmen, Lachen oder ähnliches.",
					shortcut   : {
						mac: "ALT + 4",
						pc : "ALT + 4"
					},
					use_wrap: true
				},
				{
					name       : "stationary noise",
					code       : "sta",
					icon_url   : "assets/img/components/transcr-editor/default_markers/sta.png",
					button_text: "stationary noise",     //title of text
					description: "Für lang andauerndes, lautes Geräusch wie Verkehrslärm, Musik oder Radio im Hintergrund.",
					shortcut   : {
						mac: "ALT + 5",
						pc : "ALT + 5"
					},
					use_wrap: true
				},{
					name       : "unclear word",
					code       : "**",
					icon_url   : "assets/img/components/transcr-editor/default_markers/stars.png",
					button_text: "**",     //title of text
					description: "Diesen Marker vor einem Wort setzen, welches einer unverständlichen Sprache entstammt.",
					shortcut   : {
						mac: "ALT + 6",
						pc : "ALT + 6"
					},
					use_wrap : false
				},
				{
					name       : "truncation marker end",
					code       : "abc~",
					icon_url   : "assets/img/components/transcr-editor/default_markers/truncation_end.png",
					button_text: "abc~",     //title of text
					description: "Diesen Marker nur am Ende setzen, sollte die Audiosequenz mit einem abgeschnittenem Wort enden.",
					shortcut   : {
						mac: "ALT + 7",
						pc : "ALT + 7"
					},
					use_wrap : true
				}
			]
		};
	};

	constructor() {
	}
}