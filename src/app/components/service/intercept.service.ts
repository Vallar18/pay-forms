// Angular
import {Injectable} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpHeaders} from '@angular/common/http';
// RxJS
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

import {environment} from '../../../environments/environment';

@Injectable()
export class InterceptService implements HttpInterceptor {
  // intercept request and add token
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const clientId = localStorage.getItem(environment.clientId);

    const headerConfig = {
      'x-api-key': clientId,
    };

    const userToken = localStorage.getItem(environment.authTokenKey);

    if (userToken) {
      headerConfig['Authorization'] = 'Bearer ' + userToken;
    }

    request = request.clone({
      setHeaders: headerConfig
    });

    return next.handle(request).pipe(
      tap(
        event => {
          if (event instanceof HttpResponse) {
          }
        },
        error => {
        }
      )
    );
  }
}
