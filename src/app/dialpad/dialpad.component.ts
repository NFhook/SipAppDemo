import { 
  Component,
  Input,
  Injector,
  EventEmitter,
  Output,
  OnInit
} from '@angular/core';
import { SipStatusService } from '../service/sip-status.service';

const SOUNDS = require('./sounds.json');

@Component({
  selector: 'app-dialpad',
  templateUrl: './dialpad.component.html',
  styleUrls: ['./dialpad.component.css']
})

export class DialpadComponent implements OnInit {

  
  @Input() keyPressed: string = '';
  @Output() numberPressed = new EventEmitter<string>();

  sipStatusService: SipStatusService;
  isCallDisabled: boolean = false;
  callIcon:string = "call";
  callClass:string = "green-icon";
  soundAudioClick: any;
  // durationText = '00:00:00';
  public phoneNumTable: Array<any> = [{
    row: [
      { value: '1', text: '1' },
      { value: '2', text: '2' },
      { value: '3', text: '3' }
    ]
  }, {
    row: [
      { value: '4', text: '4' },
      { value: '5', text: '5' },
      { value: '6', text: '6' }
    ]
  }, {
    row: [
      { value: '7', text: '7' },
      { value: '8', text: '8' },
      { value: '9', text: '9' }
    ]
  }, {
    row: [
      { value: '*', text: '*' },
      { value: '0', text: '0' },
      { value: '#', text: '#' }
    ]
  }];

  constructor(
    private injector: Injector
  ) {
    this.sipStatusService = this.injector.get(SipStatusService);
  }
  
  // toggleSipStatus() {
  //   this.sipStatusService.toggleSipStatus();
  // }
  ngOnInit(): void {
    this.sipStatusService.isCallDisabled$.subscribe(isDisabled => {
      this.isCallDisabled = isDisabled;
    });
  }

  onDialpadButtonClick = (key: string) => {
    
    this.numberPressed.emit(key);
    this.soundAudioClick = new Audio(SOUNDS['click']);
    this.soundAudioClick.play('click', 1);
  };

  onDialpadButtonCall = (key: string) => {
    
    this.numberPressed.emit(key);
    // this.sipStatusService.toggleSipStatus();
    // this.toggleSipStatus();
  }

  onDialPadButtonDel = (key:string) => {
    this.numberPressed.emit(key);
    this.soundAudioClick = new Audio(SOUNDS['click']);
    this.soundAudioClick.play('click', 1);
  }
}
