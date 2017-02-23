export class TranscrEditorConfig {
	public Settings: any = {
		markers      : [
			{
				name       : "filled pause",                                           //name
				code       : "fil", //code which will be used in the raw transcription text
				icon_url   : "pics/test.png",
				// Icon url. This can be everything as long as it's valid for the img src attribute
				button_text: "fil",                                             //the button value
				description: "For hesitations like hm, ähm, äh and others.",    //help text on hover
				shortcut   : {
					mac: "CTRL + L",
					pc : "CTRL + L"
				},
				use_wrap : false                                //shortcut definition
				//shurtcodes must be equal to jquery e.key properties
			}
		],
		//disabled shortcuts
		disabled_keys: [ "ENTER", "SHIFT + ENTER", "TAB" ],
		height       : 300,
		responsive:false
	};
}
