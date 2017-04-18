import { Converter } from "./Converter";
import { forEach } from "@angular/router/src/utils/collection";

export class AnnotJSONConverter extends Converter{

	public convert(data:any, filename:string):any{
		let result = this.getDefaultAnnotJSON();

		//set default settings
		result.name = filename;
		result.annotates = filename + ".wav";
		result.sampleRate = 1000;

		for(let i = 0; i < data.transcript.length; i++){
			let segment = data.transcript[i];
			result.levels[0].items.push(
				{
					id: (i+1),
					sampleStart: segment.start,
					sampleDur: segment.length,
					labels: [
						{
							name: "Orthographic",
							value: segment.text
						}
					]
				}
			);
		}

		return result;
	}

	private getDefaultAnnotJSON():any{
		return {
			name: "",
			annotates: "",
			sampleRate: 0,
			levels: [{
				name: "Orthographic",
				type: "SEGMENT",
				items: []
			}],
			links: []
		};
	}
}