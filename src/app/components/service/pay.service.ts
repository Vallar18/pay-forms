import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {environment} from '../../../environments/environment';

const API_LOGIN_URL = environment.apiUrl + 'auth';
const API_USERS_URL = environment.apiUrl + 'me';
const API_FORM_API = environment.apiUrl + 'forms/';
const API_CREDITCARDS_API = environment.apiUrl + 'creditcards';

@Injectable()
export class PayService {
  constructor(private http: HttpClient) {
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
    const params = {with: 'user,data'};
    return this.http.get<any>(API_CREDITCARDS_API, {params: this.getFindHTTPParams(params)});
  }

  /**
   * Prepare query http params
   * @param queryParams: QueryParamsModel
   */
  getFindHTTPParams(queryParams): HttpParams {
    if (queryParams) {
      const params = new HttpParams({fromObject: queryParams});
      return params;
    }
    return new HttpParams();
  }
}
