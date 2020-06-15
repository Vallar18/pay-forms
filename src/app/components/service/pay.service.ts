import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition} from '@angular/material';

const API_LOGIN_URL = environment.apiUrl + 'auth';
const API_USERS_URL = environment.apiUrl + 'me';
const API_FORM_API = environment.apiUrl + 'forms/';
const API_CREDITCARDS_API = environment.apiUrl + 'creditcards_preview';
const API_PAY_API = environment.apiUrl + 'pay';

@Injectable()
export class PayService {

  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  constructor(private http: HttpClient,
              private snackBar: MatSnackBar) {
  }

  openSnackBar(message: string, isError: boolean = false) {
    this.snackBar.open(message, '', {
      panelClass: isError ? 'snack-bar-error' : '',
      duration: 2000,
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
    });
  }

  // Authentication/Authorization
  login(data: any): Observable<any> {
    return this.http.post<any>(API_LOGIN_URL, data);
  }

  getUserByToken(): Observable<any> {
    return this.http.get<any>(API_USERS_URL).pipe(map(res => res.data ? res.data : res));
  }

  getForm(id: number) {
    return this.http.get<any>(API_FORM_API + id);
  }

  getUserCards() {
    return this.http.get<any>(API_CREDITCARDS_API);
  }

  pay(data) {
    return this.http.post(API_PAY_API, data);
  }

  // /**
  //  * Prepare query http params
  //  * @param queryParams: QueryParamsModel
  //  */
  // getFindHTTPParams(queryParams): HttpParams {
  //   if (queryParams) {
  //     const params = new HttpParams({fromObject: queryParams});
  //     return params;
  //   }
  //   return new HttpParams();
  // }
}
