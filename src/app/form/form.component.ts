import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {catchError, map, startWith} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {CreditCardValidators} from 'angular-cc-library';

import {environment} from '../../environments/environment';
import {COUNTRY} from '../components/consts/country.const';
import {STATE_US} from '../components/consts/state.const';
import {PayService} from '../components/service/pay.service';

import Pusher from 'pusher-js';

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

  params: any = {};

  pushInfo: any = {
    key: '7e30e7c146f87e5ee807',
    cluster: 'mt1',
    channel: 'events.', // + сгенерирований push_id,
    event: 'events.form'
  }
  push_id: string = '';
  paidStatusText: string = '';

  configState = {
    isLogin: false,
    isUser: false,
    isSelectMethodPay: false,
    isCard: false,
    isSelectCard: false,
    isBilling: false,
    isResult: false,
    isPaidStatus: false
  };

  currentState = {
    title: '',
    path: ''
  };

  loading = false;

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
    
    this.params = {
      type: 'modal', // - по умолчанию если не указано - modal
      auth: true,  // - по умолчанию если не указано - true
      form: 7, //  - обязательное поле
      client_id: '7fc2bc80-30c4-45da-821c-e6d7ab0fbbf2', //  - обязательное поле
      token: undefined, // - для авторизации. не обязательное.
      target: '', // для модального окна триггер/ для встраиваемого где появляться
      email: 'admin@admin.com',
      first_name: 'test f name',
      last_name: 'test l name',
      success_url: 'https://www.google.com/',  //paid
      cancel_url: 'http', // пока нет
      id: ''
    }
    
      // !paid  -> try again - страница с информацией о оплате

    this.checkConfig(this.params);
    // this.route.queryParams.subscribe(res => {
    //   if (res && res.form) {
    //     if (res.auth) {
    //       this.params.auth = (res.auth === 'true');
    //     }
    //     if (res.token) {
    //       this.params.token = res.token && res.token.length && res.token !== 'undefined' && res.token !== 'null' ? res.token : undefined;
    //     }
    //     this.params = {...res, ...this.params};
    //     this.checkConfig(this.params);
    //   }
    // });

    
    this.subscribePusher()

    // this.createUserForm();
    // this.createLoginForm();
    this.createCardForm();
    this.createBillingForm();
  }

  subscribePusher() {

    this.push_id = Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8);
    console.log(this.push_id);

    const pusher = new Pusher(this.pushInfo.key, {
      cluster: this.pushInfo.cluster,
    });;

    const channel = pusher.subscribe(this.pushInfo + this.push_id)
    
    channel.bind(this.pushInfo.event, function(data) {
        this.checkPaidStatus(data);
    });
  }

  checkPaidStatus(data: any){
// paid - Your payment successful 
// processing - Your payment Processing, yo will get notification soon
// failed - Your Payment Failed. и тут мы скоро добавим еще информацию что конкретно не так
// forbidden - Sorry your payment declined. Try later
    switch(data.status){
      case 'paid': 
        if(this.params.success_url && this.params.success_url.length){
          window.open(this.params.success_url);
        }
        break;
      case 'processing': 
        this.paidStatusText = 'Your payment Processing, yo will get notification soon';
        this.go('', 'isPaidStatus')
        break;
      case 'failed': 
        this.paidStatusText = 'Your Payment Failed. и тут мы скоро добавим еще информацию что конкретно не так';
        this.go('', 'isPaidStatus')
        break;
      case 'forbidden': 
        this.paidStatusText = 'Sorry your payment declined. Try later';
        this.go('', 'isPaidStatus')
        break;
        
      default: 
      console.log('check paid status --error swich')
    }
  } 

  checkConfig(params: any) {
    localStorage.setItem(environment.clientId, params.client_id);
    if (params.token && params.token !== 'undefined') {
      localStorage.setItem(environment.authTokenKey, params.token);
      this.getUser();
    }

    if (!params.auth && (!params.token || !params.token.length)) {
      this.createUserForm();
      this.changeState('isUser');
    }

    if (params.auth && (!params.token || !params.token.length)) {
      this.createLoginForm();
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

  showEditUserPanel() {
    if (this.configState.isSelectMethodPay) {
      if ((!this.params.auth && !this.params.token) || this.params.auth) {
        return true;
      }
    }
    return false;
  }

  back() {
    if (this.configState.isSelectMethodPay) {
      if (this.params.auth) {
        this.changeState('isLogin');
      } else {
        this.changeState('isUser');
      }
    } else if (this.configState.isCard) {
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

  go(title: string = '', patch: string) {
    this.currentState.title = title;
    this.changeState(patch);
  }

  // User

  createUserForm() {
    this.userForm = this.fb.group({
      email: [this.params.email || '', Validators.compose([Validators.required, Validators.email])],
      first_name: [this.params.first_name || '', Validators.required],
      last_name: [this.params.last_name || '', Validators.required],
      id: [this.params.id || '']
    });
  }

  getUser() {
    this.createUserForm();
    this.payService.getUserByToken().subscribe(res => {
      if (res) {
        this.user = res;
        this.userForm.get('id').setValue(this.user.id);
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
      username: [this.params.email || '', Validators.compose([Validators.required, Validators.email])],
      password: ['password', Validators.required],
    });
  }

  login() {
    // if (localStorage.getItem(environment.authTokenKey)) {
    //     //   return this.changeState('isSelectMethodPay');
    //     // }
    this.loading = true;

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
      catchError(res => {
        this.payService.openSnackBar(res.error.message, true);
        return of(undefined);
      })
    ).subscribe(res => {
      if (res) {
        localStorage.setItem(environment.authTokenKey, res.access_token);
        this.getUser();

        this.changeState('isSelectMethodPay');
      }
      this.loading = false;
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
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]],
      month: [''],
      year: ['']
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

    const date = this.cardForm.get('expirationDate');

    this.card = this.cardForm.value;
    this.go('Billing', 'isBilling');
  }

  getUserCards() {
    this.payService.getUserCards().subscribe(res => {
      if (res) {
        this.userCards = res.data;
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
      billing_country_obj: ['', Validators.required],
      billing_country: [''],
      billing_zipcode: ['', Validators.required],
      billing_address: ['', Validators.required],
      billing_city: ['', Validators.required],
      billing_state: ['', Validators.required],
    });
    this.prepareSelectorArray(COUNTRY, this.countries);
    this.filteredCountries = this.billingForm.get('billing_country_obj').valueChanges
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
    this.billingForm.get('billing_country').setValue(value.code);
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

  // Pay
  pay(methodType: string) {

    this.loading = true;

    let data = {
      form_id: this.params.form,
      method_id: this.method.id,
      push_id: this.push_id
    };

    if (methodType === 'creditcard') {
      if (this.card.id) {
        const card = {
          creditcard: {
            id: this.card.id
          }
        };
        data = {...data, ...card};
      } else {

        this.prepateCreditcardDate();

        const card = {
          creditcard: this.card,
          user: this.userForm.value,
          total: this.form.total,
        };
        data = {...data, ...card};
      }
    }
    if (methodType === 'cryptocurrency') {
      const card = {
        user: this.userForm.value,
      };
      data = {...data, ...card};
    }
    if (methodType === 'balance') {

    }

    this.payService.pay(data).pipe(
      catchError(res => {
        this.payService.openSnackBar(res.error.message, true);
        console.log(res);
        return of(undefined);
      })
    ).subscribe(res => {
      if (res) {
        this.payService.openSnackBar(res.data.message, false);
        console.log(res);
      }
      this.loading = false;

    });
  }

  prepateCreditcardDate() {
    const date: string = this.cardForm.get('expirationDate').value;
    const split = date.split('/');
    this.card.month = split[0];
    this.card.year = split[1];

    if (this.card.expirationDate) {
      delete this.card.expirationDate;
    }
  }
}


