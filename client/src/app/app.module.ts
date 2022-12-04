import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HomeComponent } from './views/home/home.component';
import { AuthComponent } from './views/auth/auth.component';
import { NavComponent } from './views/partials/nav/nav.component';
import { ScanComponent } from './views/scan/scan.component';

import { CookieService } from './services/cookie.service';
import { QueryService } from './services/query.service';

const isAuthenticated = (cookieService: CookieService) => {
  return cookieService.getCookie('access_token')
    ? HomeComponent
    : AuthComponent;
};

@NgModule({
  declarations: [AppComponent, HomeComponent, AuthComponent, NavComponent, ScanComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot([
      { path: '', component: isAuthenticated(new CookieService()) },
      { path: 'scan/:playlistId', component: ScanComponent },
    ]),
    FormsModule,
  ],
  providers: [CookieService, QueryService],
  bootstrap: [AppComponent],
})
export class AppModule { }
