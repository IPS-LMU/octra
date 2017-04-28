import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SessionService} from '../../service/session.service';
import {ModalComponent} from 'ng2-bs3-modal/components/modal';
import {NavbarService} from '../../service/navbar.service';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {isNullOrUndefined} from 'util';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})

export class NavigationComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('modalexport') modalexport: ModalComponent;
  @Input('version') version: string;

  public test = 'ok';
  collapsed = true;

  constructor(public sessService: SessionService,
              public navbarServ: NavbarService,
              public sanitizer: DomSanitizer,
              public langService: TranslateService) {
  }

  ngOnDestroy() {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    (($) => {
      $(() => {
        $(document).on('click', '.options-menu', function (e) {
          e.stopPropagation();
        });
      });
    })(jQuery);

    jQuery(document).on('mouseleave', '.navbar-collapse.collapse.in', function (e) {
      jQuery('.navbar-header button').click();
    });
    setTimeout(() => {
      jQuery.material.init();
    }, 200);
  }

  setInterface(new_interface: string) {
    this.sessService.Interface = new_interface;

  }

  onNavBarLeave($event) {
    $event.target.click();
  }

  getTextFile() {
    const txt = '';
    /*
     let data = this.tranServ.exportDataToJSON();

     let tc:TextConverter = new TextConverter();
     txt = tc.convert(data);

     alert(txt);*/
  }

  getURI(format: string): string {
    let result = '';

    switch (format) {
      case('text'):
        result += 'data:text/plain;charset=UTF-8,';
        result += encodeURIComponent(this.navbarServ.exportformats.text);
        break;
      case('annotJSON'):
        result += 'data:application/json;charset=UTF-8,';
        result += encodeURIComponent(this.navbarServ.exportformats.annotJSON);
        break;
    }

    return result;
  }

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  changeLanguage(lang: string) {
    this.langService.use(lang);
    this.sessService.language = lang;
  }

  public interfaceActive(name: string) {
    return !(isNullOrUndefined(
        this.navbarServ.interfaces.find((x) => {
          return name === x;
        })
      ));
  }

  toggleEasyMode() {
    this.sessService.easymode = !this.sessService.easymode;
  }

  onOptionsOpened() {
    console.log('OKOK');
    this.collapsed = true;
  }
}
