import { Group } from "../FeedbackForm/Group";

export interface ProjectConfiguration {
	version: string,
	force_logging: boolean,
	responsive: {
		enabled: boolean,
		fixedwidth: number
	},
	agreement: {
		enabled: boolean,
		text: any
	},
	languages: string[],
	interfaces: string[],
	feedback_form: Group[]
}