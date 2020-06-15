import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule, MatDialogModule,
  MatIconModule,
  MatInputModule, MatListModule, MatProgressSpinnerModule,
  MatRadioModule,
  MatSelectModule, MatSnackBarModule, MatTabsModule
} from '@angular/material';
import {FormComponent} from './form/form.component';
import {PayService} from './components/service/pay.service';
import {InterceptService} from './components/service/intercept.service';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';

import { CreditCardDirectivesModule } from 'angular-cc-library';

@NgModule({
  declarations: [
    AppComponent,
    FormComponent
  ],
  entryComponents: [
    FormComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      {path: 'pay-form', component: AppComponent},
      {path: '**', redirectTo: 'pay-forms', pathMatch: 'full'},
    ]),
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // angular material modules
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDialogModule,
    MatListModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    CreditCardDirectivesModule
  ],
  providers: [
    InterceptService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptService,
      multi: true
    },
    PayService,

  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
