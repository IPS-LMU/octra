import { ConfigValidator, ValidationResult } from "../shared/ConfigValidator";
import { isNullOrUndefined } from "util";
import { isArray } from "util";

export class ProjectConfigValidator extends ConfigValidator {

	private version: string = "1.1.0";

	public validate(key: string, value: any): ValidationResult {
		let prefix: string = "ProjectConfig Validation - ";

		switch (key) {
			case("version"):
				if (typeof value === "string") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type string"
				};
			case("logging"):
				if (typeof value[ key ] !== "object") {
					return {
						success: false,
						error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type boolean"
					};
				}
				else {
					if (!value[ key ].hasOwnProperty("forced")
						|| !(typeof value[ key ][ "forced" ] === "boolean")
					) {
						return {
							success: false,
							error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type {enabled:boolean}"
						};
					}
				}
				break;
			case("navigation"):
				if (typeof value[ key ] !== "object") {
					return {
						success: false,
						error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type boolean"
					};
				}
				else {
					if (!value[ key ].hasOwnProperty("export")
						|| !(typeof value[ key ][ "export" ] === "boolean")
					) {
						return {
							success: false,
							error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type {enabled:boolean}"
						};
					}
				}
				break;
			case("responsive"):
				if (typeof value[ key ] !== "object") {
					return {
						success: false,
						error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type boolean"
					};
				}
				else {
					if (!value[ key ].hasOwnProperty("enabled")
						|| !(typeof value[ key ][ "enabled" ] === "boolean")
					) {
						return {
							success: false,
							error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type {enabled:boolean, fixedwidth: number}"
						};
					}
					if (!value[ key ].hasOwnProperty("fixedwidth")
						|| !(typeof value[ key ][ "fixedwidth" ] === "number")
					) {
						return {
							success: false,
							error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type {enabled:boolean, fixedwidth: number}"
						};
					}
				}
				break;
			case("agreement"):
				if (typeof value[ key ] !== "object") {
					return {
						success: false,
						error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type boolean"
					};
				}
				else {
					if (!value[ key ].hasOwnProperty("enabled")
						|| !(typeof value[ key ][ "enabled" ] === "boolean")
					) {
						return {
							success: false,
							error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type {enabled:boolean, fixedwidth: number}"
						};
					}
					if (!value[ key ].hasOwnProperty("text")
						|| !(typeof value[ key ][ "text" ] === "object")
					) {
						return {
							success: false,
							error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type {enabled:boolean, fixedwidth: number}"
						};
					}
				}
				break;
			case("languages"):

				if (!isArray(typeof value[ key ])) {
					return {
						success: false,
						error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type array"
					};
				}

				break;
			case("interfaces"):
				if (!isArray(typeof value[ key ])) {
					return {
						success: false,
						error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type array"
					};
				}
				break;
			case("feedback_form"):
				if (!isArray(typeof value[ key ])) {
					return {
						success: false,
						error  : prefix + "key '" + key + "." + value[ key ] + "' must be of type array"
					};
				}
				break;
		}

		return {
			success: true,
			error  : ""
		};
	}
}