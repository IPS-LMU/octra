import { Group } from "../../shared/FeedbackForm/Group";

export interface ProjectConfiguration {
	version: string,
	logging: {
		enabled: boolean
	},
	navigation: {
		"export": boolean,
		"interfaces": boolean
	},
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
	plugins: any,
	feedback_form: Group[]
}