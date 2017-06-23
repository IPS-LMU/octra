import {Component, OnDestroy, OnInit} from '@angular/core';
import {Http} from '@angular/http';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {Functions} from '../../shared/Functions';
import {isNullOrUndefined} from 'util';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit, OnDestroy {

  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  public app_news: {
    date: Date,
    title: string,
    content: string
  }[] = [];
  public prod_news: {
    date: Date,
    title: string,
    content: string
  }[] = [];

  public app_news_page = 0;
  public prod_news_page = 0;

  public get Math(): any {
    return Math;
  }

  public get app_news_filtered(): any[] {
    const entries = this.getEntries(this.app_news, this.app_news_page + 1);
    if (isNullOrUndefined(entries)) {
      return [];
    } else {
      return entries;
    }
  };

  public get prod_news_filtered(): any[] {
    const entries = this.getEntries(this.prod_news, this.prod_news_page + 1);
    if (isNullOrUndefined(entries)) {
      return [];
    } else {
      return entries;
    }
  };

  public MAXNEWSPERPAGE = 5;

  public pages(news: any[]): number[] {
    const result: number[] = [];

    for (let i = 1; i <= Math.ceil(news.length / this.MAXNEWSPERPAGE); i++) {
      result.push(i);
    }

    return result;
  }

  public getEntries(news: any[], page: number): any[] {
    const result = [];

    const start = (page === 1) ? 0 : (page - 1) * this.MAXNEWSPERPAGE;
    let end = ((page - 1) * this.MAXNEWSPERPAGE + this.MAXNEWSPERPAGE);
    end = Math.min(end, news.length);
    for (let i = start; i < end; i++) {
      result.push(news[i])
    }

    return result;
  }

  constructor(private http: Http) {
  }

  ngOnInit() {
    const observable = Functions.uniqueHTTPRequest(this.http, false, null, './assets/contents/app_news.json', null);
    this.subscrmanager.add(observable.subscribe(
      (result) => {
        const news = result.json();

        for (let i = 0; i < news.length; i++) {
          news[i].date = new Date(news[i].date);
        }

        this.app_news = news.sort(this.sortArrayByDateDesc);
      }
    ));

    const observable2 = Functions.uniqueHTTPRequest(this.http, false, null, './assets/contents/prod_news.json', null);
    this.subscrmanager.add(observable2.subscribe(
      (result) => {
        const news = result.json();

        for (let i = 0; i < news.length; i++) {
          news[i].date = new Date(news[i].date);
        }

        this.prod_news = news.sort(this.sortArrayByDateDesc);
      }
    ));
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  sortArrayByDateDesc = (a, b) => {
    if (a.date === b.date) {
      return 0;
    } else if (a.date < b.date) {
      return 1;
    }
    return -1;
  };

}
