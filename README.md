# `SipAppDemo`

### `sip demo`

> base janus-gateway sip demo and  angular 16

```bash
$ ng new sipApp
$ npm install janus-gateway
```

> demo
```bash
$ git clone https://github.com/NFhook/SipAppDemo.git
$ cd SipAppDemo
$ npm install
$ npm run dev
```

TODO: 

* [x] 1. Auto Answer；
* [x] 2. Incomingcall;
* [x] 3. Helper auto inc / dec(support multistream call)；
* [x] 4. Call Timer；
* [x] 5. Dialpad and  DTMF；


#### `register`

![image-20230814000503342](https://github.com/NFhook/sipAppDemo/blob/main/src/assets/images/sipapp/register.png)

#### `incomingcall`

![image-20230814000632767](https://github.com/NFhook/sipAppDemo/blob/main/src/assets/images/sipapp/incomingcall.png)

#### `outbound`

![outbound](https://github.com/NFhook/sipAppDemo/blob/main/src/assets/images/sipapp/outbound.png)


### QA:

1. compile failed(reference issue list)

    `node_module/janus-gateway/janus.d.ts`
    ```ts
    type GetScreenCallback = (error?, sourceId?) => void
    //change
    type GetScreenCallback = (error?:any, sourceId?:any) => void
    ```
2. about register:
>  direct register:
>
>  > register to freeswitch:
>
>  ```bash
>  Server: sip:10.10.22.10:5070
>  Username: sip:1001@10.10.22.10:5070
>  Authuser: 1001
>  Password: 1001
>  Displayname: 1001
>  ```
>
>  > request:
>
>  ```json
>  {
>      "janus": "message",
>      "body": {
>          "request": "register",
>          "username": "sip:1001@10.10.22.10:5070",
>          "authuser": "1001",
>          "display_name": "1001",
>          "secret": "1001",
>          "proxy": "sip:10.10.22.10:5070",
>          "outbound_proxy": "sip:10.10.22.10:5070"
>      },
>      "transaction": "dmdjgUPft598",
>      "apisecret": "janusrocks",
>      "session_id": 826270005010382,
>      "handle_id": 7504801142837563
>  }
>  ```
>
>  > status:
>
>  ```xml
>  freeswitch@NFhook> sofia status profile internal reg
>  Registrations:
>  =================================================================================================
>  Call-ID:    	2fe1ebf5-c4d3-123d-c382-000c29501dac
>  User:       	1001@10.10.22.10
>  Contact:    	"1001" <sip:1001@10.10.22.10:49705;transport=udp>
>  Agent:      	RTC
>  Status:     	Registered(UDP)(unknown) EXP(2024-07-25 11:49:17) EXPSECS(3641)
>  Ping-Status:	Reachable
>  Ping-Time:	0.00
>  Host:       	NFhook
>  IP:         	10.10.22.10
>  Port:       	49705
>  Auth-User:  	1001
>  Auth-Realm: 	10.10.22.10
>  MWI-Account:	1001@10.10.22.10
>  
>  Total items returned: 1
>  =================================================================================================
>  ```

![direct_register](https://github.com/NFhook/sipAppDemo/blob/main/src/assets/images/sipapp/direct_register.png)

>  proxy register:
>
>  > register to opensips:
>
>  ```bash
>  Server: sip:10.10.22.10:5060
>  Username: sip:8008@dev.io
>  Authuser: 8008
>  Password: 8008
>  Displayname: 8008
>  ```
>
>  > request:
>
>  ```json
>  {
>      "janus": "message",
>      "body": {
>          "request": "register",
>          "username": "sip:8008@dev.io",
>          "authuser": "8008",
>          "display_name": "8008",
>          "secret": "8008",
>          "proxy": "sip:10.10.22.10:5060",
>          "outbound_proxy": "sip:10.10.22.10:5060"
>      },
>      "transaction": "piqdu51Fwtec",
>      "apisecret": "janusrocks",
>      "session_id": 1539282642826541,
>      "handle_id": 7250372459212115
>  }
>  ```
>
>  > status:
>
>  ```json
>  # opensips-cli -x mi ul_dump
>  {
>      "Domains": [
>          {
>              "name": "location",
>              "hash_size": 512,
>              "AORs": [
>                  {
>                      "AOR": "8008@dev.io",
>                      "Contacts": [
>                          {
>                              "Contact": "sip:8008@10.10.22.10:52224;transport=udp",
>                              "ContactID": "4559217660687155477",
>                              "Expires": 253,
>                              "Q": "",
>                              "Callid": "65eac609-c4d3-123d-c382-000c29501dac",
>                              "Cseq": 86384107,
>                              "User-agent": "RTC",
>                              "State": "CS_SYNC",
>                              "Flags": 0,
>                              "Cflags": "",
>                              "Socket": "udp:10.10.22.10:5060",
>                              "Methods": 5439
>                          }
>                      ]
>                  }
>              ]
>          }
>      ]
>  }
>  ```

![proxy_register](https://github.com/NFhook/sipAppDemo/blob/main/src/assets/images/sipapp/proxy_register.png)

