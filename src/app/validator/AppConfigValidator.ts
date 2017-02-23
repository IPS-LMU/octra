import { ConfigValidator, ValidationResult } from "../shared/ConfigValidator";
import { SecurityContext } from "@angular/core";

export class AppConfigValidator extends ConfigValidator {

	public validate(key: string, value: any): ValidationResult {
		let prefix: string = "AppConfig Validation - ";

		switch (key) {
			case("AUDIO_SERVER"):
				if (typeof value === "string" && (value.indexOf("https://") > -1 || value.indexOf("http://") > -1)) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type string and must contain http:// or https://"
				};
			case("LOGGING"):
				if (typeof value === "boolean") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type boolean"
				};
			case("RESPONSIVE"):
				if (typeof value === "boolean") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type boolean"
				};
			case("ALLOWED_BROWSERS")   :
				let obj_ok = true;
				if (Array.isArray(value)) {
					for (let elem in value) {
						if (typeof value[ "" + elem + "" ] !== "object" || typeof value[ "" + elem + "" ].name !== "string") {
							obj_ok = false;
							break;
						}
					}
				}
				if (!obj_ok) {
					return {
						success: false,
						error  : prefix + "value of key '" + key + "' must be of array and must contain elements of {name:string}"
					};
				}
				break;
			case("DISALLOWED_BROWSERS")   :
				let objects_ok = true;
				if (Array.isArray(value)) {
					for (let elem in value) {
						if (typeof value[ "" + elem + "" ] !== "object" || typeof value[ "" + elem + "" ].name !== "string") {
							objects_ok = false;
							break;
						}
					}
				}
				if (!objects_ok) {
					return {
						success: false,
						error  : prefix + "value of key '" + key + "' must be of array and must contain elements of {name:string}"
					};
				}
				break;
			case("WRAP"):
				if (typeof value === "string" && (value.length == 0 || value.length == 2)) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type string and must contain either 0 or 2 chars"
				};
			case("MARKERS"):
				if (Array.isArray(value)) {
					let validation = true;
					for (let i = 0; i < value.length; i++) {
						let elem = value[ i ];
						if (typeof elem === "object") {
							if (!elem.hasOwnProperty("name") && !elem.hasOwnProperty("code")
								|| !elem.hasOwnProperty("icon_url") || !elem.hasOwnProperty("button_text")
								|| !elem.hasOwnProperty("description") || !elem.hasOwnProperty("use_wrap")
								|| !elem.hasOwnProperty("shortcut")
								|| typeof elem.shortcut !== "object" || !elem.shortcut.hasOwnProperty("mac")
								|| !elem.shortcut.hasOwnProperty("pc") || typeof elem.shortcut.mac !== "string"
								|| typeof elem.shortcut.pc !== "string" || typeof elem.use_wrap !== "boolean"
							) {
								validation = false;
								break;
							}
						}
					}

					if(validation)
						break;
				}
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be an Array of markers. Compare custom config with sample config"
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