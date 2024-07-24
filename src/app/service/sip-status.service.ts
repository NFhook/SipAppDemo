import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class SipStatusService {

  private _isCallDisabled = new BehaviorSubject<boolean>(false);
  private sipEventSubject = new Subject<boolean>();

  isCallDisabled$ = this._isCallDisabled.asObservable();

  toggleSipStatus() {
    this._isCallDisabled.next(!this._isCallDisabled.value);
  }

  triggerSipEvent(isCalling:boolean){
    this.sipEventSubject.next(isCalling);
  }
  onCallingEvent(){
    return this.sipEventSubject.asObservable();
  }
  constructor() { }
}
