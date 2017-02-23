import { APP_CONFIG } from "../app.config";
import { BrowserInfo } from "./BrowserInfo";
export class BrowserCheck{
	private platform:BrowserInfo = new BrowserInfo();

	public isValidBrowser():boolean{
		let all_brwosers = APP_CONFIG.Settings.ALLOWED_BROWSERS;

		for(let i = 0; i < all_brwosers.length; i++){
			let browser = all_brwosers[i];
			if(browser.name === platform.name){
				return true;
			}
		}

		return false;
	}

	public isValidWindowWidth():boolean{
		return (window.innerWidth >= 1200);
	}
}