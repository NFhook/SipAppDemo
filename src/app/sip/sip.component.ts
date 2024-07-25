import { Component, Output,  EventEmitter, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';

import Janus from 'janus-gateway';
import { AudioPlayer } from '../../utils/audioplayer/audio_player';
import { DialpadComponent } from '../dialpad/dialpad.component';

import { SipStatusService } from '../service/sip-status.service';
import { TimerService } from '../service/timer.service';
import { TimeUtils } from 'src/utils/time.utils';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-sip',
  templateUrl: './sip.component.html',
  styleUrls: ['./sip.component.css']
})

export class SipComponent  implements OnInit {
  @Output() onDurationText = new EventEmitter<any>();
  //
  hide = true;
  title = environment.production? 'Production' : 'Development';
  callClass: string = 'green-icon';
  callIcon: string = 'call';

  isCallDisabled: boolean = false;
  sipStatus: string = '离线';

  formData = {
    server: 'sip:10.10.22.10:5060',
    username: 'sip:8008@dev.io',
    authuser: '8008',
    password: '8008',
    displayname: '8008'
  };

  // sip info
  janus: any = '';
  server: any = '';
  opaqueId: string = '';
  sipcall: any = null;
  started: boolean = false;
  registered: boolean = false;
  running: boolean = false;
  masterId: any = null;
  helpers: any = {};
  helpersCount = 0;
  incomingDialog: any = null;
  incoming: any = null;

  playRingInterval: any = null;
  reconnectInterval: any = null;
  reconnectTimes = 0;

  localTracks: any = {};
  localVideos = 0;
  remoteTracks: any = {};
  remoteVideos = 0;

  autoAnswer: boolean = false;
  autoAnswerTimeout: any = null;

  doAudio = true;
  doVideo = false;
  offerlessInvite = false;
  jsep: any = null;
  //CUSTOM
  //iceServer: use stun or turn, suggest coturn server. 
  iceServers = [{urls: "stun:10.10.22.10:3478"},{urls: "turn:10.10.22.10:3478?transport=udp", credential: "coturnadmin", username: "coturn"}];
  // janus-gateway config file `janus.jcfg` apisecret
  apisecret: string = 'janusrocks';

  callee: string = '';
  sipUser: string = '';

  /*
    custom duration
  */
  // duration Timer
  duration: number = 0;
  durationText: string = '';
  private intervalSubscription: Subscription | undefined;
  durationSubscribe: any;
  //---------------------------------------------------------
  count:number = 0;

  constructor(
    public dialog: MatDialog,
    private timerService:TimerService,
    private sipStatusService: SipStatusService
    ) {};
  //--------------------------------
  ngOnInit() {
    this.opaqueId = 'sip-' + Janus.randomString(12);
    //CUSTOM
    this.server = 'wss://10.10.22.10:8989/janus'; 
    Janus.init({ debug: true,callback: this.onInitDone });
    this.running = true;
    // fromEvent(document, 'click').subscribe(() => console.log('Clicked!  ' + this.count++));
  };

  stop = () => {
    if (this.janus) {
      this.janus.destroy();
      this.running = false;
    }
  };

  registerUsername = () => {
    let sipserver = this.formData.server;
    if(sipserver !== "" && sipserver.indexOf("sip:") != 0 && sipserver.indexOf("sips:") !=0) {
        Janus.error("Please insert a valid SIP server (e.g., sip:192.168.0.1:5060)");
        return;
    }
    let username = this.formData.username;
    if(username === "" || username.indexOf("sip:") != 0 || username.indexOf("@") < 0) {
        Janus.error('Please insert a valid SIP identity address (e.g., sip:goofy@example.com)');
        return;
    }
    let password = this.formData.password;
    if(password === "") {
        Janus.error("Insert the username secret (e.g., mypassword)");
        return;
    }
    let authuser = this.formData.authuser;
    if(authuser === "") {
        Janus.error("Insert the authuser (e.g., goofy)");
        return;
    }
    let displayname = this.formData.displayname;
    if(displayname === "") {
        Janus.error("Insert the displayname (e.g., goofy)");
        return;
    }

    let register: any = {
		request: "register",
		username: username,
        authuser: authuser,
        display_name: displayname,
        secret: password,
        proxy: sipserver,
        outbound_proxy: sipserver
	};
    this.sipcall.send({ message: register });
  };

  doCall = () => {
    /*
    let button = ev ? ev.currentTarget.id : "call";
    let helperId = button.split("call")[1];
	if(helperId === "")
		helperId = null;
	else
		helperId = parseInt(helperId);
    let handle = helperId ? this.helpers[helperId].sipcall : this.sipcall;
    let prefix = helperId ? ("[Helper #" + helperId + "]") : "";
    */
    let uri = this.callee;
    if(uri === "") {
        Janus.log('Please insert a valid SIP address (e.g., sip:pluto@example.com)');
        return;
    }
    if(uri.indexOf("sip:") != 0 || uri.indexOf("@") < 0) {
        uri = "sip:" + uri + "@" + "10.10.22.10:5060";
        //Janus.log('Please insert a valid SIP address (e.g., sip:pluto@example.com)');
        //return;
    }
    if(this.isCallDisabled) {
        this.doHangup();
        return;
    }
    // Call this URI
    let doVideo = false;
    Janus.log("This is a SIP " + (doVideo ? "video" : "audio") + " call (dovideo=" + doVideo + ")");
    //this.actuallyDoCall(handle, username, doVideo);
    this.sipcall.doAudio = true;
	this.sipcall.doVideo = doVideo;
	let tracks = [{ type: 'audio', capture: true, recv: true }];
	if(doVideo)
		tracks.push({ type: 'video', capture: true, recv: true });
    this.sipcall.createOffer({
        tracks: tracks,
        success: (jsep: any) => {
            Janus.debug("Got SDP!", jsep);
            let body: any = { request: "call", uri: uri };
            this.sipcall.send({ message: body, jsep: jsep });
        },
        error: (error: any) => {
            Janus.error("WebRTC error...", error);
        }
    });
  };

  actuallyDoCall = (handle: any, uri: any, doVideo: any, referId: any) => {
    handle.doAudio = true;
    handle.doVideo = doVideo;
    let tracks = [{ type: 'audio', capture: true, recv: true }];
    if(doVideo)
        tracks.push({ type: 'video', capture: true, recv: true });
    handle.createOffer(
        {
            tracks: tracks,
            success: (jsep: any) => {
                Janus.debug("Got SDP!", jsep);
                let body: any = { request: "call", uri: uri };
                body["autoaccept_reinvites"] = false;
                if(referId) {
                    body["refer_id"] = referId;
                }
                handle.send({ message: body, jsep: jsep });
            },
            error: (error: any) => {
				Janus.error("WebRTC error...", error);
			}
    });
  };

  doAnswer = (offerlessInvite: any, jsep: any, doAudio: any, doVideo: any) => {
    
    let helperId = this.helpersCount > 0 ? this.helpersCount : 0;
    if(helperId-- <= 0) {
        helperId = 0;
    }
    Janus.log("::: doAnswer() ::: " + "Helper #" + helperId);
    // this.callIcon = 'call_end';
    // this.callClass = 'red-icon';
    let sipcallAction: any;
    if(!helperId) {
        sipcallAction = (offerlessInvite ? this.sipcall.createOffer : this.sipcall.createAnswer);
    }else{
        sipcallAction = (offerlessInvite ? this.helpers[helperId].sipcall.createOffer : this.helpers[helperId].sipcall.createAnswer);
    }
    let tracks = [];
    if(doAudio)
        tracks.push({ type: 'audio', capture: true, recv: true });
    if(doVideo)
        tracks.push({ type: 'video', capture: false, recv: false });
    sipcallAction(
        {
            jsep: jsep,
            tracks: tracks,
            success: (jsep: any) => {
                Janus.debug("Got SDP " + jsep.type + "! audio=" + doAudio + ", video=" + doVideo + ":", jsep);
                this.loopPlayRinging(false);
                if(!helperId){
                    this.sipcall.doAudio = doAudio;
                    this.sipcall.doVideo = doVideo;
                }else{
                    this.helpers[helperId].sipcall.doAudio = doAudio;
                    this.helpers[helperId].sipcall.doVideo = doVideo;
                }
                let body: any = { request: "accept" };
                body["autoaccept_reinvites"] = true;
                if(!helperId){
                    this.sipcall.send({ message: body, jsep: jsep });
                }else{
                    this.helpers[helperId].sipcall.send({ message: body, jsep: jsep});
                }
                // Call to Hangup
            },
            error: (error: any) => {
                
                Janus.error("WebRTC error:" + error);
                Janus.error("WebRTC error... " + error.message);
                this.loopPlayRinging(false);
                let body: any = { request: "decline", code: 480 };
                if(!helperId){
                    this.sipcall.send({ message: body });
                } else{
                    this.helpers[helperId].sipcall.send({ message: body });
                }                
            }

    });

  };

  doDecline = (callinPhone: any) => {
    this.callIcon = 'call';
    this.callClass = 'green-icon';
    let helperId = this.helpersCount > 0 ? this.helpersCount : 0;
    if(helperId-- <= 0) {
        helperId = 0;
    }
    let body = { request: "decline" };
    if(!helperId){
        this.sipcall.send({"message": body});
    }else{
        this.helpers[helperId].sipcall.send({"message": body});
    }
    this.loopPlayRinging(false);
  };

  doHangup = () => {
    Janus.log("::: doHangup() ::: Count => " + this.helpersCount);
    // this.isCallDisabled = !this.isCallDisabled;
    let helperId = this.helpersCount > 0 ? this.helpersCount : 0;
    if(helperId-- <= 0) {
        helperId = 0;
    }
    let hangup = {
      request: 'hangup',
    };
    if(!helperId){
        this.sipcall.send({ message: hangup });
        this.sipcall.hangup();
    }else{
        this.helpers[helperId].sipcall.send({ message: hangup });
        this.helpers[helperId].sipcall.hangup();
    }
  };

  closeHandler = () => {
    console.info('connected janus gateway websocket is closed');
    if (this.running === true) {
      console.info('janus is running and reconnect to janus server');
      if (
        typeof this.reconnectInterval === 'undefined' ||
        !this.reconnectInterval
      ) {
        this.reconnectInterval = setInterval(() => {
          this.reconnectTimes = this.reconnectTimes + 1;
          if (this.reconnectTimes < 120) {
            console.info('start to reconnect janus server');
            if (this.running === true) {
              this.started = false;
              this.onInitDone();
            }
          }
        }, 5000);
      }
    }
  };

  loopPlayRinging = (start: boolean) => {
    if (start == true) {

      if (!this.playRingInterval) {
        this.playRingInterval = () => {
          AudioPlayer.play("ringing", 0.2, () => {
            setTimeout(() => {
              if (this.playRingInterval) {
                this.playRingInterval();
              }
            }, 2500);
          });
        }
        this.playRingInterval();
      }
    } else {
      Janus.debug("stop loop play ring interval");
      this.playRingInterval = null;
    }
  };

  onInitDone = () => {
    if (this.started) {
        Janus.warn('sip phone is started!');
        return;
    }
    this.started = true;
    if (!Janus.isWebrtcSupported()) {
        console.log("No WebRTC support... ");
        return;
    }
    // create session
    this.janus = new Janus({
        iceServers: this.iceServers,
        apisecret: this.apisecret,
        server: this.server,
        success: () => {
            Janus.log('clean reconnect interval');
            if (this.reconnectInterval) {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }
            this.janus.attach({
                plugin: 'janus.plugin.sip',
                opaqueId: this.opaqueId,
                success: (pluginHandle: any) => {
                    this.sipcall = pluginHandle;
                    Janus.log('Plugin attached! (' + this.sipcall.getPlugin() + ', id=' + this.sipcall.getId() + ')');
                },
                error: (error: any) => {
                    Janus.error('  -- Error attaching plugin...', error);
                },
                consentDialog: (on: any) => {
                    Janus.debug('Consent dialog should be ' + (on ? 'on' : 'off') + ' now');
                },
                iceState: (state: any) => {
                    Janus.log('ICE state changed to ' + state);
                },
                mediaState: (medium: any, on: any, mid: any) => {
                    Janus.log('Janus ' +  (on ? 'started' : 'stopped') + ' receiving our ' + medium + ' (mid=' + mid + ')');
                    Janus.log('##########' + this.helpersCount + '##########');
                },
                webrtcState: (on: any) => {
                    Janus.log('Janus says our WebRTC PeerConnection is ' + (on ? 'up' : 'down') + ' now');
                },
                slowLink: (uplink: any, lost: any, mid: any) => {
                    Janus.warn('Janus reports problems ' + (uplink ? 'sending' : 'receiving') + ' packets on mid ' + mid + ' (' + lost + ' lost packets)');
                },
                onmessage: (msg: any, jsep: any) => {
                    Janus.debug(" ::: Got a message :::", msg);
                    this.jsep = jsep;
                    // Any error?
                    let error = msg['error'];
                    if (error) {
                        if (!this.registered) {
                            Janus.warn('sip phone not registed!');
                        } else {
                            // Reset status
                            this.sipcall.hangup();
                        }
                        Janus.log(error);
                        return;
                    }
                    let callId = msg['call_id'];
					let result = msg['result'];
                    if ( result && result['event']) {
                        let event = result['event'];
                        if (event === 'registration_failed') {
                            Janus.warn('Registration failed: ' + result['code'] + ' ' + result['reason']);
                              this.sipStatus = '注册失败';
                              return;
                        }
                        if(event === 'registered') {
                            Janus.log('Successfully registered as ' + result['username'] + '!');
                            this.masterId = result['master_id'];
                            if (!this.registered) {
                                this.registered = true;
                            }
                            this.sipUser = result['username'];
                            this.sipStatus = '在线';
                        } else if(event === 'calling') {
                            Janus.log('Waiting for the peer to answer...');
                            this.addHelper();
                            this.sipStatus = '呼叫中';
                            this.callIcon = 'call_end';
                            this.callClass = 'red-icon';
                            this.isCallDisabled = !this.isCallDisabled;
                            this.sipStatusService.toggleSipStatus();
                        } else if(event === 'incomingcall') {
                            this.addHelper();
                            this.callIcon = 'call_end';
                            this.callClass = 'red-icon';
                            this.isCallDisabled = !this.isCallDisabled;
                            this.sipStatusService.toggleSipStatus();
                            this.sipStatus = '呼入中';
                            this.loopPlayRinging(true);
                            Janus.log('Incoming call from ' + result['username'] + '!');
                            if(!this.callee){
                                this.callee = result["username"];
                            }
                            this.sipcall.callId = callId;
                            if (jsep) {
                                // What has been negotiated?
                                this.doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
                                //this.doVideo = (jsep.sdp.indexOf("m=video ") > -1);
                                this.doVideo = false;
                                Janus.debug('Audio ' + (this.doAudio ? 'has' : 'has NOT') + ' been negotiated');
                                Janus.debug('Video ' + (this.doVideo ? 'has' : 'has NOT') + ' been negotiated');
                            } else {
                                Janus.log("This call doesn't contain an offer... we'll need to provide one ourselves");
                                this.offerlessInvite = true;
                                // In case you want to offer video when reacting to an offerless call, set this to true
                                this.doVideo = false;
                            }
                            let rtpType = "";
                            let srtp = result["srtp"];
                            if(srtp === 'sdes_optional'){
                                rtpType = " (SDES-SRTP offered)";
                            } else if(srtp === "sdes_mandatory") {
                                rtpType = " (SDES-SRTP mandatory)";
                            }
                            let extra = "";
                            if(this.offerlessInvite)
                                extra = " (no SDP offer provided)"
                            let callinPhone = result['username'];
                            //自动应答
                            if(this.autoAnswer) {
                                this.loopPlayRinging(false);
                                this.autoAnswerTimeout = setTimeout(() => {
                                    this.doAnswer(this.offerlessInvite, jsep, this.doAudio, this.doVideo);
                                    this.autoAnswerTimeout = null;
                                }, 1000);
                            } else {
                                // 弹屏
                                this.incomingcallDialog(callinPhone, this.offerlessInvite,jsep,this.doAudio,this.doVideo);
                            }
                        } else if(event === 'accepting') {
                            // Response to an offerless INVITE, let's wait for an 'accepted'
                            this.sipStatus = '待应答';
                        } else if(event === 'progress') {
                            Janus.log("There's early media from " + result["username"] + ", wairing for the call!", jsep);
                            if(jsep) {
                                this.sipcall.handleRemoteJsep({ jsep: jsep, error: this.doHangup });
                            }
                            Janus.log('Early media...');
                        } else if(event === 'accepted') {
                            this.startTimer();
                            this.sipStatus = '通话中';
                            Janus.log(result["username"] + " accepted the call!", jsep);
                            if (jsep) {
                              this.sipcall.handleRemoteJsep({
                                jsep: jsep,
                                error: this.doHangup,
                              });
                            }
                            Janus.log('Call accepted!');
                            this.sipcall.callId = callId;
                            AudioPlayer.play("answered", 0.8);
                        } else if(event === 'updatingcall') {
                            Janus.log('Got re-INVITE');
                            let doAudio = (jsep.sdp.indexOf("m=audio ") > -1),
                                doVideo = (jsep.sdp.indexOf("m=video ") > -1);
                            let tracks = [];
                            if(doAudio && !this.sipcall.doAudio) {
								this.sipcall.doAudio = true;
								tracks.push({ type: 'audio', capture: true, recv: true });
							}
                            if(doVideo && !this.sipcall.doVideo) {
                                this.sipcall.doVideo = true;
                                tracks.push({ type: 'video', capture: true, recv: true });
                            }
                            this.sipcall.createAnswer(
                                {
                                    jsep: jsep,
                                    tracks: tracks,
                                    success: (jsep: any) => {
                                        Janus.debug('Got SDP ' + jsep.type + '! audio=' + doAudio + ', video=' + doVideo + ':', jsep);
                                        let body = { request: "update" };
                                        this.sipcall.send({ message: body, jsep: jsep });
                                    },
                                    error: (error: any) => {
                                        Janus.error('WebRTC error:', error);
                                        Janus.error('WebRTC error:', error.message);
                                    },
                            });
                        } else if(event === 'message') {
                            // We got a MESSAGE
                            let sender = result["displayname"] ? result["displayname"] : result["sender"];
                            let content = result["content"];
                            content = content.replace(new RegExp('<', 'g'), '&lt');
                            content = content.replace(new RegExp('>', 'g'), '&gt');
                            Janus.log(content, "Message from " + sender);
                        } else if(event === 'info') {
                            // We got an INFO
                            let sender = result["displayname"] ? result["displayname"] : result["sender"];
                            let content = result["content"];
	                        content = content.replace(new RegExp('<', 'g'), '&lt');
                            content = content.replace(new RegExp('>', 'g'), '&gt');
                            Janus.log(content, "Info from " + sender);
                        } else if(event === 'notify') {
                            // We got a NOTIFY
                            let notify = result["notify"];
	                        let content = result["content"];
                            Janus.log(content, "Notify (" + notify + ")");
                        } else if(event === 'transfer') {
                        } else if(event === 'hangup') {
                            let helperId = this.helpersCount;
                            this.stopTimer();
                            Janus.log("Call hung up (" + result["code"] + " " + result["reason"] + ")!");
                            // Reset status
                            this.sipcall.hangup();
                            AudioPlayer.play("hangup", 1);
                            this.loopPlayRinging(false);
                            this.callIcon = 'call';
                            this.callClass = 'green-icon';
                            this.sipStatusService.toggleSipStatus();
                            this.sipStatus = '挂机完成';
                            this.removeHelper(helperId);
                            this.isCallDisabled = !this.isCallDisabled;
                            let code = result["code"];
                            let reason = result["reason"];
                            if(!this.autoAnswer){
                                // 弹屏
                                this.hangupDialog(reason, code);
                            }

                        } else if(event === 'messagedelivery') {
                            // message delivery status
                            let reason = result["reason"];
                            let code = result["code"];
                            let callid = msg['call_id'];
                            if (code == 200) {
                                Janus.log(callid + 'Delivery Status:' + code + reason);
                            } else {
                                Janus.log(callid + 'Delivery Status:' + code + reason)
                            }
                        }
                    }
                },
                onlocaltrack: (track: any, on: any) => {
                    Janus.debug('Local track ' + (on ? 'added' : 'removed') + ':', track);
                    let trackId = track.id.replace(/[{}]/g, "");
                    if (!on) {
                        let stream = this.localTracks[trackId];
                        if (stream) {
                            try {
                                let tracks = stream.getTracks();
                                for (let i in tracks) {
                                    let mst = tracks[i];
                                    if (mst)
                                        mst.stop();
                                }
                            } catch(e) {}
                        }
                        if (track.kind === 'video') {
                            this.localVideos--;
                            if (this.localVideos === 0) {
                                // No video, at least for now: show a placeholder
                            }
                        }
                        delete this.localTracks[trackId];
                        return;
                    }
                    // If we're here, a new track was added
                    let stream = this.localTracks[trackId];
                    if (stream) {
                        // We've been here already
                        return;
                    }
                    if(track.kind === 'audio') {
                        // We ignore local audio tracks, they'd generate echo anyway
                        if(this.localVideos === 0) {
                            // No video, at least for now: show a placeholder
                        }
                    } else {
                        // New video track: create a stream out of it
                        this.localVideos++;
                        stream = new MediaStream([track]);
                        this.localTracks[trackId] = stream;
                        Janus.log("Created local stream:", stream);
                        Janus.attachMediaStream(trackId.get(0), stream);
                    }
                    if(this.sipcall.webrtcStuff.pc.iceConnectionState !== 'completed' &&
    					this.sipcall.webrtcStuff.pc.iceConnectionState !== 'connected') {
                        Janus.log('ICE connection state is not completed and connected! Calling...');
                    }
                },
                onremotetrack: (track: any, mid: any, on: any) => {

                    Janus.debug("Remote track (mid=" + mid + ") " + (on ? "added" : "removed") + ":", track);
                    let stream = new MediaStream([track]);
                    this.remoteTracks[mid] = stream;
                    Janus.log('Created remote audio stream:', stream);
                    Janus.debug(JSON.stringify(stream))
                    // let remoteAudio = document.getElementById('ystechremoteaudio');
                    let remoteAudio = document.getElementById('ysremoteaudio') as HTMLMediaElement;

                    if (!remoteAudio) {
                        remoteAudio = document.createElement('audio');
                        remoteAudio.id = "ystechremoteaudio";
                        remoteAudio.style.display = "none";
                        remoteAudio.autoplay = true;
                        document.body.appendChild(remoteAudio);
                    }
                    Janus.attachMediaStream(remoteAudio, stream);
                },
                oncleanup: () => {
                    Janus.log(" ::: Got a cleanup notification :::");
                    if (this.sipcall) {
                        delete this.sipcall.callId;
                        delete this.sipcall.doAudio;
                        delete this.sipcall.doVideo;
                    }
                    this.localTracks = {};
                    this.localVideos = 0;
                    this.remoteTracks = {};
                    this.remoteVideos = 0;
                },
            });
        },
        error: (error) => {
            Janus.error(error);
            this.loopPlayRinging(false);
            if(error.indexOf("Lost connection to the server") > -1) {
                this.closeHandler();
            }
        },
        destroyed: () => {
            this.loopPlayRinging(false);
            this.stop();
        },
    });
  };

  // addHelper
  addHelper = () => {
    // helperCreated = (typeof helperCreated == "function") ? helperCreated : this.janus.noop;
	this.helpersCount++;
	let helperId = this.helpersCount;
	this.helpers[helperId] = {
        id: helperId,
        localTracks: {},
        localVideos: 0,
        remoteTracks: {},
        remoteVideos: 0
    };
    this.janus.attach({
        plugin: "janus.plugin.sip",
        opaqueId: this.opaqueId,
        success: (pluginHandle: any) => {
            this.helpers[helperId].sipcall = pluginHandle;
            Janus.log(
                "[Helper #" +
                 helperId +
                 "] Plugin attached! (" +
                 this.helpers[helperId].sipcall.getPlugin() + 
                 ", id=" +
                 this.helpers[helperId].sipcall.getId() +
                  ")"
            );
            // TODO Send the "register"
            this.helpers[helperId].sipcall.send({
                message: {
                    request: "register",
                    type:   "helper",
                    username: this.formData.username,
                    master_id: this.masterId
                }
            });
        },
        error: (error: any) => {
            Janus.error(
                "[Helper #" +
                helperId +
                "]   -- Error attaching plugin...", 
                error
            );
            this.removeHelper(helperId);
        },
        consentDialog: (on: any) => {
            Janus.debug(
                "[Helper #" +
                helperId +
                "] Consent dialog should be " +
                (on ? "on" : "off") + " now",
            );
            if(on) {
                Janus.debug('Consent dialog should be ' + (on ? 'on' : 'off') + ' now');
                Janus.log('请允许使用麦克风');
            }
        },
        iceState: (state: any) => {
            Janus.log(
                "[Helper #" +
                helperId +
                "] ICE state changed to " +
                state
            );
        },
        mediaState: (medium: any, on: any, mid: any) => {
            Janus.log(
                "[Helper #" +
                helperId +
                "] Janus " +
                (on ? "started" : "stopped") +
                " receiving our " +
                medium +
                " (mid=" +
                mid +
                ")"
            );
            Janus.log("[Helper #"+ helperId + "] " + '##########' + this.helpersCount + '##########');
        },
        webrtcState: (on: any) => {
            Janus.log(
                "[Helper #" +
                helperId +
                "] Janus says our WebRTC PeerConnection is " +
                (on ? "up" : "down") +
                " now"
            );
        },
        slowLink: (uplink: any, lost: any, mid: any) => {
            Janus.warn(
                "Janus reports problems "
                + (uplink ? "sending" : "receiving") +
				" packets on mid "+
                mid + " (" + lost +
                " lost packets)"
            );
        },
        onmessage: (msg: any, jsep: any) => {
            Janus.debug("[Helper #" + helperId + "]  ::: Got a message :::", msg);
            // Any error?
            let error = msg["error"];
            if(error) {
                Janus.log("::: Error msg :::" + error);
                return;
            }
            let callId = msg["call_id"];
            let result = msg["result"];
            if(result && result["event"]) {
                let event = result["event"];
                if(event === 'registration_failed') {
                    Janus.warn("[Helper #" +
                        helperId + 
                        "] Registration failed: " + 
                        result["code"] + 
                        " " + result["reason"]
                    );
                    Janus.log(result["code"] + " " + result["reason"]);
                    this.removeHelper(helperId);
                    return;
                }
                if(event === 'registered') {
                    Janus.log("[Helper #" + 
                        helperId + "] Successfully registered as " + 
                        result["username"] + "!"
                    );
                    if (!this.registered) {
                        this.registered = true;
                    }
                } else if(event === 'calling') {
                    Janus.log("[Helper #" + helperId + "] Waiting for the peer to answer...");
                    this.sipStatus = '呼叫中';
                    this.callIcon = 'call_end';
                    this.callClass = 'red-icon';
                    this.addHelper();
                    this.sipStatusService.toggleSipStatus();
                } else if(event === 'incomingcall') {
                    this.addHelper();
                    this.sipStatusService.toggleSipStatus();
                    this.callIcon = 'call_end';
                    this.callClass = 'red-icon';
                    this.sipStatus = '呼入中';
                    this.loopPlayRinging(true);
                    Janus.log(
                        "[Helper #" + helperId + "] Incoming call from " + 
                        result["username"] + "! (on helper #" + helperId + ")"
                    );
                    this.helpers[helperId].sipcall.callId = callId;
                    let doAudio = true, doVideo = false;
                    let offerlessInvite = false;
                    if(jsep) {
                        doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
                        // doVideo = (jsep.sdp.indexOf("m=video ") > -1);
                        doVideo = false;
                        Janus.debug("[Helper #" + helperId + "] Audio " + (doAudio ? "has" : "has NOT") + " been negotiated");
                        Janus.debug("[Helper #" + helperId + "] Video " + (doVideo ? "has" : "has NOT") + " been negotiated");
                    } else {
                        Janus.log(
                            "[Helper #" + helperId + 
                            "] This call doesn't contain an offer... we'll need to provide one ourselves"
                        ); 
                        offerlessInvite = false;
                        doVideo = false;
                    }
                    let transfer = "";
                    let referredBy = result["referred_by"];
                    let replaces = result["replaces"];
                    if(referredBy && replaces) {
                        transfer = " (referred by " + referredBy + ", replaces call-ID " + replaces + ")";
                    } else if(referredBy && !replaces) {
                        transfer = " (referred by " + referredBy + ")";
                    } else if(!referredBy && replaces) {
                        transfer = " (replaces call-ID " + replaces + ")";
                    }
                    transfer = transfer.replace(new RegExp('<', 'g'), '&lt');
                    transfer = transfer.replace(new RegExp('>', 'g'), '&gt');
                    let rtpType = "";
                    let srtp = result["srtp"];
                    if(srtp === "sdes_optional") {
                        rtpType = " (SDES-SRTP offered)";
                    } else if(srtp === "sdes_mandatory") {
                        rtpType = " (SDES-SRTP mandatory)";
                    }
                    let extra = "";
                    if(offerlessInvite) {
						extra = " (no SDP offer provided)";
                    }
                    let callinPhone = result['username'];
                    // 自动应答
                    if(this.autoAnswer) {
                        this.autoAnswerTimeout = setTimeout(() => {
                            this.doAnswer(offerlessInvite, jsep, doAudio, doVideo);
                            this.autoAnswerTimeout = null;
                        }, 1000);
                    } else {
                        // 弹屏
                        this.incomingcallDialog(callinPhone, offerlessInvite, jsep, doAudio, doVideo);
                    }
                } else if(event === 'accepting') {
                    Janus.log("::: Accepting... :::");
                } else if(event === 'progress') {
                    Janus.log(
                        "[Helper #" + helperId + "] There's early media from " +
                        result["username"] + ", wairing for the call!", jsep
                    );
                    if(jsep) {
                        this.helpers[helperId].sipcall.handleRemoteJsep({ jsep: jsep, error: () => {
                            // Simulate an hangup from this helper's button
                            let hangup = { request: "hangup" };
                            this.helpers[helperId].sipcall.send({ message: hangup });
                            this.helpers[helperId].sipcall.hangup();
                        }});
                    }
                } else if(event === 'accepted') {
                    Janus.log(
                        "[Helper #" + helperId + "] " + result["username"] + 
                        " accepted the call!", jsep
                    );
                    if(jsep) {
                        this.helpers[helperId].sipcall.handleRemoteJsep({ jsep: jsep, error: () => {
                            // Simulate an hangup from this helper's button
                            let hangup = { request: "hangup" };
                            this.helpers[helperId].sipcall.send({ message: hangup });
                            this.helpers[helperId].sipcall.hangup();
                        }});
                    }
                    this.helpers[helperId].sipcall.callId = callId;
                } else if(event === 'updatingcall') {

                } else if(event === 'message') {

                } else if(event === 'info') {

                } else if(event === 'notify') {

                } else if(event === 'transfer') {

                } else if(event === 'hangup') {
                    if(this.incoming != null) {
                        this.incoming = null;
                    }
                    Janus.log("[Helper #" + helperId + "] Call hung up (" + result["code"] + " " + result["reason"] + ")!");
                    Janus.log(result["code"] + " " + result["reason"]);
                    Janus.log("==============  " + result["helper"] + "  ==============");
                    Janus.log(JSON.stringify(result));
                    this.helpers[helperId].sipcall.hangup();
                    this.sipStatusService.toggleSipStatus();
                    this.removeHelper(helperId);
                } else if(event === 'messagedelivery') {

                }
            }
        },
        onlocaltrack: (track: any, on: any) => {
            Janus.debug("[Helper #" + helperId + "] Local track " + (on ? "added" : "removed") + ":", track);
            let trackId = track.id.replace(/[{}]/g, "");
            if(!on) {
                let stream = this.helpers[helperId].localTracks[trackId];
                if(stream) {
                    try {
                        let tracks = stream.getTracks();
                        for(let i in tracks) {
                            let mst = tracks[i];
                            if (mst) {
                                mst.stop();
                            }
                        }
                    } catch(e) {}
                }
                if(track.kind === "video") {
                    this.helpers[helperId].localVideos--;
                    if(this.helpers[helperId].localVideos === 0) {
                    }
                }
                delete this.helpers[helperId].localTracks[trackId];
                return;
            }
            // if we're here, a new track was added
            let stream = this.helpers[helperId].localTracks[trackId];
            if (stream) {
                // We've been here already
                return;
            }
            if (track.kind === "audio") {
                if(this.helpers[helperId].localVideos === 0){}
            } else {
                // New video track: create a stream out of it
            }
            if(this.helpers[helperId].sipcall.webrtcStuff.pc.iceConnectionState !== "completed" &&
            this.helpers[helperId].sipcall.webrtcStuff.pc.iceConnectionState !== "connected"){}
        },
        onremotetrack: (track: any, mid: any, on: any) => {
            Janus.debug(
                "[Helper #" +
                helperId +
                "] Remote track (mid=" +
                mid +
                ") " +
                (on ? "added" : "removed") +
                ":", track
            );
            if(!this.helpers[helperId])
                return;
            // if(track.kind === "audio") {
                // New audio track: create a stream out of it, and use a hidden <audio> element
            let stream = new MediaStream([track]);
            this.helpers[helperId].remoteTracks[mid] = stream;
            Janus.log("[Helper #" + helperId + "] Created remote audio stream:", stream);
            let remoteAudio = document.getElementById(helperId  + mid + 'ysremoteaudio') as HTMLMediaElement;
            if (!remoteAudio) {
                remoteAudio = document.createElement('audio');
                remoteAudio.id = helperId + mid + 'ysremoteaudio';
                remoteAudio.style.display = "none";
                remoteAudio.autoplay = true;
                document.body.appendChild(remoteAudio);
            }
            Janus.attachMediaStream(remoteAudio, stream);
            // }
        },
        oncleanup: () => {
            Janus.log(
                "[Helper #" +
                helperId +
                "]  ::: Got a cleanup notification :::"
            );
            if(this.helpers[helperId] && this.helpers[helperId].sipcall) {
                delete this.helpers[helperId].sipcall.callId;
                delete this.helpers[helperId].sipcall.doAudio;
                delete this.helpers[helperId].sipcall.doVideo;
            }
            if(this.helpers[helperId]) {
                this.helpers[helperId].localTracks = {};
                this.helpers[helperId].localVideos = 0;
                this.helpers[helperId].remoteTracks = {};
                this.helpers[helperId].remoteAudio = 0;
            }
        }
    });
  };

  // removeHelper
  removeHelper = (helperId: any) => {
    Janus.log("[Helper #" + helperId + "] Removed!");
    if(this.helpersCount > 0) {
        if(this.helpers[helperId] && this.helpers[helperId].sipcall) {
		// Detach from the helper's Janus handle
		    this.helpers[helperId].sipcall.detach();
		    delete this.helpers[helperId];
		// Remove the related UI too
		//$('#sipcall'+helperId).remove();
	    }
        this.helpersCount--;
    }
  };

  dtmf = (keystroke: string) => {
    console.log(keystroke);
    this.sipcall.dtmf({dtmf: { tones: keystroke, duration: 60}})
  };

//   onRegister = () => {
//     console.log('Form data submitted:', this.formData);
//     this.registerUsername();
//   };

//   ngAfterViewInit() {
//     this.init();
//   };

  openDialPadDialog = () => {
    const dialogRef = this.dialog.open(DialpadComponent, {
        height: '360px',
        width:  '320px',
        position:{top: '165px'},
        data: {durationText: this.durationText},
    });
    dialogRef.componentInstance.numberPressed.subscribe((keyPressed: string) => {

        if(keyPressed === 'call') {
            
            if(this.callee.length > 0 ) {
                if (!this.isCallDisabled){
                    this.doCall();
                }else{
                    this.doHangup();
                }
            }
        }else if(keyPressed === 'del'){
            if(this.callee.length > 0 && !this.isCallDisabled) {
                this.callee = this.callee.slice(0, -1);
            }
        }else if(this.isCallDisabled) {
            this.dtmf(keyPressed);
        }else{
            this.callee += keyPressed;
        }
    }); 
  };

  incomingcallDialog = (callinPhone:boolean, offerlessInvite:boolean, jsep:any, doAudio:boolean,doVideo:boolean) => {
    const dialogRef = this.dialog.open(DialogComponent, {
        height: '200px',
        width:  '600px',
        disableClose: true,
        autoFocus: true,
        position:{top: '60px'},
        data: { callinPhone: callinPhone, isIcomingCall: true },
    });
    dialogRef.afterClosed().subscribe((result:any) => {
        if(result === 'answer') {
            this.doAnswer(offerlessInvite, jsep, doAudio, doVideo);
        } else if(result === 'decline') {
            this.doDecline(callinPhone);
        }
    });
  };

  hangupDialog = (reason:string, code:string) => {
    const dialogRef = this.dialog.open(DialogComponent, {
        height: '200px',
        width:  '600px',
        disableClose: true,
        autoFocus: true,
        position:{top: '60px'},
        data: { reason: reason, code: code, isHangup: true },
    });
    dialogRef.afterClosed().subscribe((result:any) => {
        if(result === 'ok') {
            Janus.log("Hangup complete!")   
        }
    });
  };

  startTimer = () => {
    if(!this.intervalSubscription) {
      this.clearDuration();
      this.intervalSubscription = this.timerService.onInterval$.subscribe(() => {
          this.duration++;
          this.durationText = TimeUtils.getDurationText(this.duration);
      });
    }
  };

  stopTimer = () => {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = undefined;
    }
  };

  clearDuration() {
    this.duration = 0;
    this.durationText = '';
  };
}