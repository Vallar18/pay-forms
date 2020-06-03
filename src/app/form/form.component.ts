import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {PayService} from '../components/service/pay.service';
import {environment} from '../../environments/environment';
import {catchError, map, startWith} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {COUNTRY} from '../components/consts/country.const';
import {STATE_US} from '../components/consts/state.const';
import {CreditCardValidators} from 'angular-cc-library';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  countries: any[] = [];
  filteredCountries: Observable<any[]>;
  states: any[] = [];

  showStateUs = false;

  params = {
    type: 'embed', // - по умолчанию если не указано - modal
    auth: true,  // - по умолчанию если не указано - true
    form: 1, //  - обязательное поле
    client_id: '7fc2bc80-30c4-45da-821c-e6d7ab0fbbf2', //  - обязательное поле
    token: undefined, // - для авторизации. не обязательное.
    target: '', // для модального окна триггер/ для встраиваемого где появляться
    user: {
      email: 'admin@admin.com',
      first_name: 'test f name',
      last_name: 'test l name'
    }
  };

  configState = {
    isLogin: false,
    isUser: false,
    isSelectMethodPay: false,
    isCard: false,
    isSelectCard: false,
    isBilling: false,
    isResult: false,

  };

  currentState = {
    title: '',
    path: ''
  };

  // loading: boolean = true;

  user: any = {};
  form: any = {};
  userCards: any[] = [];
  card: any = {};
  method: any = {};

  userForm: FormGroup;
  loginForm: FormGroup;
  cardForm: FormGroup;
  billingForm: FormGroup;

  constructor(private fb: FormBuilder,
              private route: ActivatedRoute,
              private payService: PayService) {
  }

  ngOnInit() {
    this.checkConfig(this.params);
    this.createUserForm();
    this.createLoginForm();
    this.createCardForm();
    this.createBillingForm();
  }

  checkConfig(params: any) {
    localStorage.setItem(environment.clientId, params.client_id);
    if (params.token) {
      localStorage.setItem(environment.authTokenKey, params.token);
      this.getUser();
    }

    if (!params.auth && (!params.token || !params.token.length)) {
      // this.createUserForm();
      this.changeState('isUser');
    }

    if (params.auth && (!params.token || !params.token.length)) {
      // this.createLoginForm();
      this.changeState('isLogin');
    }

    if (params.form) {
      this.getForm(+params.form);
    }
  }

  changeState(selectField: string) {
    Object.keys(this.configState).map(field => {
      this.configState[field] = false;
    });
    // this.currentState = {
    //   title: selectField,
    //   path: selectField
    // };
    if (selectField && selectField.length) {
      this.configState[selectField] = true;
    }
  }

  showTopBar() {
    if (this.configState.isCard || this.configState.isBilling || this.configState.isSelectCard || this.configState.isResult) {
      return true;
    }
    return false;
  }

  back() {
    if (this.configState.isCard) {
      this.changeState('isSelectMethodPay');
    } else if (this.configState.isBilling || this.configState.isSelectCard) {
      this.go('Credit Card', 'isCard');
    } else if (this.configState.isResult) {
      if (this.card && this.card.id) {
        this.go('Select Card', 'isSelectCard');
      } else if (this.method.type !== 'creditcard') {
        this.changeState('isSelectMethodPay');
      } else {
        this.go('Billing', 'isBilling');
      }
    }
  }

  go(title: string, patch: string) {
    this.currentState.title = title;
    this.changeState(patch);
  }

  // User

  createUserForm() {
    this.userForm = this.fb.group({
      email: [this.params.user.email || '', Validators.compose([Validators.required, Validators.email])],
      first_name: [this.params.user.first_name || '', Validators.required],
      last_name: [this.params.user.last_name || '', Validators.required],
    });
  }

  getUser() {
    this.payService.getUserByToken().subscribe(res => {
      if (res) {
        this.user = res;
        this.changeState('isSelectMethodPay');
      }
    });
  }

  saveUser() {
    const controls = this.userForm.controls;
    /** check form */
    if (this.userForm.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );
      return;
    }

    this.user = this.userForm.value;
    this.changeState('isSelectMethodPay');
  }

  // Login
  createLoginForm() {
    this.loginForm = this.fb.group({
      username: [this.params.user.email || '', Validators.compose([Validators.required, Validators.email])],
      password: ['password', Validators.required],
    });
  }

  login() {
    // if (localStorage.getItem(environment.authTokenKey)) {
    //     //   return this.changeState('isSelectMethodPay');
    //     // }
    // this.loading = true;

    const controls = this.loginForm.controls;
    /** check form */
    if (this.loginForm.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );
      return;
    }

    const data = this.loginForm.value;
    this.payService.login(data).pipe(
      catchError(error => {
        console.log(error);
        return of(undefined);
      })
    ).subscribe(res => {
      if (res) {
        localStorage.setItem(environment.authTokenKey, res.access_token);
        this.getUser();

        this.changeState('isSelectMethodPay');
      }
    });
  }

  // Form

  getForm(formId: number) {
    this.payService.getForm(formId).subscribe(res => {
      if (res) {
        this.form = res.data;
      }
    });
  }

  selectMethod(method: any) {
    this.method = method;
    if (method.type === 'creditcard') {
      this.getUserCards();
      this.currentState.title = method.name;
      this.changeState('isCard');
    } else {
      this.go('Result', 'isResult');
    }
  }

  // Card

  createCardForm() {
    // this.getUserCards();
    this.cardForm = this.fb.group({
      number: ['', [CreditCardValidators.validateCCNumber]],
      save_card: [''],
      expirationDate: ['', [CreditCardValidators.validateExpDate]],
      cvc: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]]
    });
  }

  saveCard() {
    const controls = this.cardForm.controls;
    /** check form */
    if (this.cardForm.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );
      return;
    }
    this.card = this.cardForm.value;
    this.go('Billing', 'isBilling');
  }

  getUserCards() {
    this.payService.getUserCards().subscribe(res => {
      if (res) {
        this.userCards = res.data.data;
      }
    });
  }

  selectCard(card) {
    console.log(card);
    this.card = card;
    this.go('Result', 'isResult');
  }

  // Billing

  createBillingForm() {
    this.billingForm = this.fb.group({
      billing_country: ['', Validators.required],
      billing_country_code: [''],
      billing_zipcode: ['', Validators.required],
      billing_address: ['', Validators.required],
      billing_city: ['', Validators.required],
      billing_state: ['', Validators.required],
    });
    this.prepareSelectorArray(COUNTRY, this.countries);
    this.filteredCountries = this.billingForm.get('billing_country').valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
  }

  private _filter(value: string | any): string[] {

    const filterValue = value && value.name ? value.name.toLowerCase() : value.toLowerCase();

    return this.countries.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  prepareSelectorArray(obj: any, array: any[]) {
    Object.keys(obj).map(key => {
      const item = {
        name: obj[key] + ' ' + key,
        code: key
      };
      array.push(item);
    });
  }

  displayFn(item: any): string {
    return item && item.name ? item.name : item;
  }

  selectCountry(value) {
    this.billingForm.get('billing_country_code').setValue(value.code);
    if (value.code === 'US') {
      this.showStateUs = true;
      this.prepareSelectorArray(STATE_US, this.states);
    } else {
      this.showStateUs = false;
    }
  }

  saveBilling() {
    const controls = this.billingForm.controls;
    /** check form */
    if (this.billingForm.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );
      return;
    }
    this.card = {...this.card, ...this.billingForm.value};
    this.go('Result', 'isResult');
  }

  /**
   * Checking control validation
   *
   * @param form: => FormGroup
   * @param controlName: string => Equals to formControlName
   * @param validationType: string => Equals to valitors name
   */
  isControlHasError(form: FormGroup, controlName: string, validationType: string): boolean {
    const control = form.controls[controlName];
    if (!control) {
      return false;
    }

    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
  }

}


