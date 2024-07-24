import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  onInterval$: Subject<any> = new Subject<any>();
  loopTimer: any;

  constructor() { 
    this.startLoopTimer();
  }

  startLoopTimer = () => {
    this.loopTimer = setInterval(() => {
      this.onInterval$.next(undefined);
    }, 1000);
  }

  stopLoopTimer = () => {
    clearInterval(this.loopTimer);
  }
}