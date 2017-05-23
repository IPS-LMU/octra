export class AudioplayerConfig {
    public Settings: any = {
        audiosrc: '',
        height: 30,
        backgroundcolor: 'rgb(255,255,255)',
        framecolor: 'rgb(200,0,0)',
        margin: {
            top: 5,
            right: 15,
            bottom: 10,
            left: 15
        },
        cursor: {
            color: 'rgb(0, 0, 0)'
        },
        playcursor: {
            height: 20,
            width: 10,
            color: 'rgb(77, 122, 105)'
        },
        slider: {
            height: 5,
            color: 'rgb(177, 222, 205)'
        },
        // SHORTCUTS
        // SHORTCUTS scheme: KeyMapping [+ <char or charCode>]
        shortcuts_enabled: true,
        shortcuts: {
            play_pause: {
                keys: {
                    mac: 'TAB',
                    pc: 'TAB'
                },
                title: 'play pause',
                focusonly: false
            },
            stop: {
                keys: {
                    mac: 'ESC',
                    pc: 'ESC'
                },
                title: 'stop playback',
                focusonly: false
            },
            step_backward: {
                keys: {
                    mac: 'SHIFT + BACKSPACE',
                    pc: 'SHIFT + BACKSPACE'
                },
                title: 'step backward',
                focusonly: false
            },
            step_backwardtime: {
                keys: {
                    mac: 'SHIFT + TAB',
                    pc: 'SHIFT + TAB'
                },
                title: 'step backward time',
                focusonly: false
            }
        }
    };
}
