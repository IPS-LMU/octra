import { ConfigValidator, ValidationResult } from "../../../shared/ConfigValidator";


export interface Margin {
	top: number,
	right: number,
	bottom: number,
	left: number
}

export class AudioviewerConfigValidator extends ConfigValidator {

	public validate(key: string, value: any): ValidationResult {
		let prefix: string = "AudioviewerConfig Validation - ";

		switch (key) {
			case("multi_line"):
				if (typeof value === "boolean") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type boolean"
				};
			case("pixel_per_sec"):
				if (typeof value === "number" && value > 0) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type number greater 0"
				};
			case("justify_signal_height"):
				if (typeof value === "boolean") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type boolean"
				};
			case("cropping"):
				if (typeof value === "string") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type string"
				};

			case("backgroundcolor"):
				if (typeof value === "string") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type string"
				};
			case("height"):
				if (typeof value === "number" && value > 0) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type number greater 0"
				};
			case("margin"):
				if (
					typeof value === "object" && typeof value.top === "number" && typeof value.right === "number"
					&& typeof value.bottom === "number" && typeof value.left === "number"
				) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an object with attributes {top:number,right:number,bottom:number,left:number}"
				};
			case("cursor"):
				if (typeof value === "object" && typeof value.color === "string") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must an object of {color:string}"
				};
			case("playcursor"):
				if (typeof value === "object" && typeof value.height === "number" && typeof value.width === "number" && typeof value.color === "string") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an object with attributes {height:number,width:number}"
				};
			case("boundaries"):
				if (
					typeof value === "object" && typeof value.enabled === "boolean"
					&& typeof value.width === "number" && value.width > 0 && typeof value.color === "string" && typeof value.readonly === "boolean"
				) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an object with attributes { enabled:boolean, " +
					"width:number, color : string}"
				};
			case("grid"):
				if (
					typeof value === "object" && typeof value.color === "string" && typeof value.enabled === "boolean"
				) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an object with attributes { enabled:boolean, " +
					"color : string}"
				};
			case("data"):
				if (
					typeof value === "object" && typeof value.color === "string"
				) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an object with attributes {" +
					"color : string}"
				};
			case("selection"):
				if (
					typeof value === "object" && typeof value.enabled === "boolean" && typeof value.color === "string"
				) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an object with attributes {enabled:boolean, " +
					"color : string}"
				};
			case("frame"):
				if (
					typeof value === "object" && typeof value.color === "string"
				) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an object with attributes {" +
					"color : string}"
				};
			case("shortcuts_enabled"):
				if (typeof value === "boolean") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type boolean"
				};
			case("disabled_keys"):
				if (Array.isArray(value)) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type array"
				};
			case("shortcuts"):
				if (typeof value === "object") {
					for (let shortc in value) {
						if (!value[ "" + shortc + "" ].hasOwnProperty("keys") || !value[ "" + shortc + "" ].hasOwnProperty("title")
							|| !value[ "" + shortc + "" ].hasOwnProperty("focusonly")
						)
							return {
								success: false,
								error  : prefix + "value of key '" + key + "' must be an object of shortcuts. Compare custom config with sample config"
							};
					}
					break;
				}
				break;
			case("timeline"):
				if (typeof value === "object" && typeof value.enabled === "boolean" && typeof value.height === "number" && value.height > 0
					&& typeof value.fontSize === "number" && typeof value.fontWeight === "string" && typeof value.font === "string" && typeof value.foreColor === "string"
				) break;

				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an object of width attributes {enabled:boolean, step_width_ratio: boolean, height:string, fontSize:number, fontWeight:string, font:string, foreColor:string}"
				};
			case("step_width_ratio"):
				if (typeof value === "number" && value > 0) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type number greater 0"
				};

			default:
				return {
					success: false,
					error  : prefix + "key '" + key + "' not found"
				};
		}

		return {
			success: true,
			error  : ""
		};
	}
}