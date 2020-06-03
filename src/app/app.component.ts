import {Component, OnInit} from '@angular/core';

import {MatDialog} from '@angular/material';

import {FormComponent} from './form/form.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  showModal = false ;

  constructor(private dialog: MatDialog) {
  }

  ngOnInit(): void {
    if (this.showModal) {
      const dialogRef = this.dialog.open(FormComponent);
      dialogRef.afterClosed().subscribe(res => {
        if (!res) {
          return;
        }
        console.log('norm');
      });
    }
  }

}
