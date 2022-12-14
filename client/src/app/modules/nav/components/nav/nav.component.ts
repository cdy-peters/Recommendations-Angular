import { Component } from '@angular/core';

import { CookieService } from 'src/app/shared/services/cookie.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent {
  constructor(private cookieService: CookieService) {}

  signout() {
    this.cookieService.deleteCookie('access_token');
    this.cookieService.deleteCookie('refresh_token');
    localStorage.clear();
    window.location.href = '/';
  }
}
