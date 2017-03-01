import { Subscription } from "rxjs";

export class SubscriptionManager {
	private subscriptions: Subscription[];

	constructor() {
		this.subscriptions = [];
	}

	public add(subscription:Subscription){
		this.subscriptions.push(subscription);
	}

	public destroy() {
		if (this.subscriptions) {
			for (let i = 0; i < this.subscriptions.length; i++) {
				this.subscriptions[ i ].unsubscribe();
			}
			this.subscriptions = [];
		}
	}
}