import {Converter} from './Converter';

export class AnnotJSONConverter extends Converter {

    public convert(data: any, filename: string): any {
        const result = this.getDefaultAnnotJSON();

        // set default settings
        result.name = filename;
        result.annotates = filename + '.wav';
        result.sampleRate = 1000;

        for (let i = 0; i < data.transcript.length; i++) {
            const segment = data.transcript[i];
            result.levels[0].items.push(
                {
                    id: (i + 1),
                    sampleStart: segment.start,
                    sampleDur: segment.length,
                    labels: [
                        {
                            name: 'Orthographic',
                            value: segment.text
                        }
                    ]
                }
            );
        }

        return result;
    }

    private getDefaultAnnotJSON(): any {
        return {
            name: '',
            annotates: '',
            sampleRate: 0,
            levels: [{
                name: 'Orthographic',
                type: 'SEGMENT',
                items: []
            }],
            links: []
        };
    }
}
