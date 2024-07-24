import { TestBed } from '@angular/core/testing';

import { SipStatusService } from './sip-status.service';

describe('SipStatusService', () => {
  let service: SipStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SipStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
