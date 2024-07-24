import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';

import { SipComponent } from './sip/sip.component';
import { DialogComponent } from './dialog/dialog.component';
import { DialpadComponent } from './dialpad/dialpad.component';
import { TimerService } from './service/timer.service';
import { SipStatusService } from './service/sip-status.service';


@NgModule({
  declarations: [
    AppComponent,
    SipComponent,
    DialogComponent,
    DialpadComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatDialogModule
  ],
  providers: [
    // TimerService,
    // SipStatusService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
