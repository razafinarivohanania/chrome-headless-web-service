# 1. Overview

This service allows to run url from instance of Chromium. It permits to evaluate html page too. It needs that client sends POST request to service. This request is treated by the service by controlling Chromium instance. Once rendering page is done, the service responds content to client.

# 2. Request

In order to treat request send by the client as expected, it must follow the specificities bellow :

  - Type : POST
  - Target : https://server:port/connection (server and port are to replace)
  - Header : it must contains at least the **Content-Type : application/json**

The parameters must be a JSON type. This complete content is :

```json
{
    "request": {
        "url": "",
        "method": "",
        "parameters": "",
        "headers": {},
        "html": ""
    },
    "proxy": {
        "host": "",
        "port": ""
    },
    "skip": {
        "resources": [],
        "url": {
            "equals": [],
            "contains": [],
            "patterns": [],
            "function": ""
        },
        "maxConnection": 0
    },
    "allow": {
        "resources": [],
        "url": {
            "equals": [],
            "contains": [],
            "patterns": [],
            "function": ""
        }
    },
    "args": [],
    "script": "",
    "show": []
}
```

**request.url**

Type : String
Mandatory : Yes

Url to run on Chromium

**request.method**

Type : String
Mandatory : Yes

Method type to use. It can take one of theses value : **get** or **post**

**request.parameters**

Type : String
Mandatory : Yes

Parameters of POST request. 

NB : If request type is GET, parameters will be ignored. All parameters must be an entity String.

**request.headers**

Type : Object
Child type : Key/Value
Mandatory : No

Headers content of request. All headers do not need to rewrite. Indeed, Chromium will complete the remains.

NB : The parameter does not afford a field for Cookie. However, you can simulate it from headers fields. For example :

```json
{
    "User-Agent" : "my user agent",
    "Cookie" : "category=1&page=7"
}
```

NB : Mentionned headers are only apply for the first request. The following requests will be managed natively by Chromium. Cookie header follows this rule. However, User-Agent is used for all requests.

**request.html**

Type : String
Mandatory : No

HTML content to simulate on Chromium.

NB : If this parameter is mentionned, Chromium does not load url from request.url but directly load the html page

**proxy.host**

Type : String
Mandatory : No (However Yes if proxy.port is mentionned)

Proxy host to use by Chromium

**proxy.port**

Type : Integer
Mandatory : No (However Yes if proxy.host is mentionned)

Proxy port to use by Chromium

**skip.resources**

Type : Array
Child type : String
Mandatory : No

It permits Chromium to not connect links which respond the mentionned resources. Possible values are : **audio**, **image**, **video**, **css** and **javascript**. For example, if we want to skip all connections to audio, image and video, we can do :

```json
[
    "audio",
    "image",
    "video"
]
```

**skip.url.equals**

Type : Array
Child type : String
Mandatory : No

It permits Chromium to not connect links which is equals on one value of mentionned list. For example :

```json
[
    "https://www.google.com",
    "https://www.google.fr"
]
```

**skip.url.contains**

Type : Array
Child type : String
Mandatory : Not

For one value of mentionned list, if the current url contains one pattern, it will be canceled. For example, if we want to ignore all links containing "google", we can do :

```json
[
    "google"
]
```

**skip.url.patterns**

Type : Array
Child type : String (must be a valid javascript regex)
Mandatory : No

Defines patterns list. Il the url responds one of theme, request will be canceled.

**skip.url.function**

Type : String
Mandatory : No

If no one of "equals", "contains" ect does not respond expected filter, we can create our own javascript function (ES6 version is supported). It must be anonyme function and need url parameter.

For example : 

```javascript
"url => url.length === 7";
```

**skip.maxConnection**

Type : Integer
Mandatory : No

For the current loading page, if requests done count (eg : image loading, sending ajax etc) is more than skip.maxConnection, all next requests will be canceled.

**allow**

Type : Object
Mandatory : No

It has the same concept of **skip**. The difference is that **allow** is inverse operation. Moreover, it does not accept maxConnection parameter.

NB : allow and skip can be mentionned at the same time. For example, if you need to cancel all connections with resource as type and you only need to authorize google links, you can do :

```json
{
    "skip": {
        "resources" : [
            "audio",
            "image",
            "video",
            "css"
        ]
    },
    "allow" : {
        "url" : {
            "contains" : [
                "google"
            ]
        }
    }
}
```

NB : Skip filter runs first before allow.

**args**

Type : Array
Child type : String
Mandatory : No

If there are arguments to inject into Chromium natively, this field is useful. For example :

```json
[
    "--no-sandbox",
    "--disable-setuid-sandbox"
]
```

NB : We can natively inject proxy from this field without passing by proxy field. It is discouraged to mention at the same time proxy on proxy field and arguments.

**script**

Type : String
Mandatory : No

If you need to simulate javascript code once page is loaded completely, you can mention this field. Inside, you can do **return**. Return value will be mentioned on service response. (See third point for more details)

Example :

```javascript
"var aElements = document.querySelectorAll('a');return aElements.length;"
```

NB : ES6 is not supported because this script is evaluated by Chromium not NodeJs

**show**

Type : Array
Child type : String
Mandatory : No

It allows to inform service that you only needs specified information on response. Here is the exhaustive list :

```json
[
    "status",
    "headers",
    "headers.request",
    "headers.response",
    "urls",
    "urls.connected",
    "urls.skipped",
    "response",
    "response.cookies",
    "response.script",
    "response.content",
    "response.content.notRendered",
    "response.content.rendered"
]
```

If we need only status result and rendered page, you can do :

```json
[
    "status",
    "response.content.rendered"
]
```

NB : If show field is not mentionned, all information will be found on service response.

# 3. Response

Once Chromium has finished his job, the service sends response to client. Data format is a JSON.

NB : If any exception was occured on Chromium or on web service, the response will be :

```json
{"error":"error description"}
```

If there is no error, you get :

```json
{
    "status": 0,
    "headers": {
        "request": {},
        "response": {}
    },
    "urls": {
        "connected": [],
        "skipped": []
    },
    "response": {
        "cookies": [],
        "script": null,
        "content": {
            "notRendered": "",
            "rendered": ""
        }
    }
}
```

NB : It is a full representation. This structure appears when no **show** request field is not mentionned.

**status**

Type : Integer

Defines connection status when Chromium load url mentionned from request.

**headers.request**

Type : Object
Child type :Key/Value

List all altered headers (or added) to send to website server

**headers.response**

Type : Object
Child type : Key/value

List headers send by website server

**urls.connected**

Type : Array
Child type : String

List all connected urls by Chromium when he has finished to load the entire page

**urls.skipped**

Type : Array
Child type : String

List all canceled urls by Chromium when he has finished to load the entire page

**response.cookies**

Type : Array
Child type : Object

List all cookies attached to page once the page wes completly loaded.

NB : Each cookie is an object type. Its structure is defined by :

```json
{
    "name": "",
    "value": "",
    "domain": "",
    "path": "",
    "expires": 0,
    "size": 0,
    "httpOnly": false,
    "secure": false,
    "session": true
}
```

**response.script**

Type : any (It can be : String, Array, Object, null etc depending on script evaluated)

Send result of evaluated script by Chromium

**response.content.notRendered**

Type : String

Return raw content sent by website when Chromium connects the url mentionned on request.

NB : Here there is no script already simulated

**response.content.rendered**

Type : String

Return page source code when it is completely loaded. In the other words, all scripts found are evaluated like rendering page, loading image, sending ajax etc.

# 4. Web service global configuration

It is a simple *configuration.json* file which is placed in **src/main/resources**. It has two main roles :

- manage browser instances
- configure web service

Its full content is :

```json
{
    "browser": {
        "maxInstances": 0,
        "maxPages": 0,
        "maxConnectionCountPerPage" : 0,
        "delayBeforeToClose": 0,
        "timeout": 0,
        "headless": true
    },
    "server": {
        "port": 0,
        "paths": {
            "home": "",
            "documentation": "",
            "connection": "",
            "test": ""
        },
        "directoryTemporaryFile" : ""
    },
    "request" : {
        "maxPostParametersSize": ""
    }
}
```

**browser.maxInstances**

Type : Integer
Mandatory : Yes

Define the maximum count of Chromium instances allowed. If there is an overflow, an exception will be rised and the client will be informed.

**browser.maxPages**

Type : Integer
Mandatory : Yes

Define the maximum pages count that Chromium can open. If there is an exceeding, an exception will be rised and the client will be informed.

**browser.maxConnectionCountPerPage**

Type : Integer
Mandatory : Yes

Define the maximum requests count allowed for the current page loaded by Chromium. If there is an exceeding, no exception will be rised but all next requests will be canceled.

**browser.delayBeforeToClose**

Type : Integer
Unit : milliseconde
Mandatory : Yes

Open a new instance of Chromium is heavy. The best way is to avoid closing immediately the instance when it has finished to load page. It will still opened. However, when delayBeforeToClose is reached, the service will close it will checking if there is anymore page loading. If there is again a loading page, the service will attempt to close it later.

**browser.timeout**

Type : Integer
Unit : milliseconde
Mandatory : Yes

When Chromium load page but the page still not loaded completly after timeout, it stops the loading.

**browser.headless**

Type : Boolean
Mandatory : Yes

It the value is true, Chromium will be launched without graphic interface and vice versa for a false value.

NB : Using false value is discouraged because it consumes more resource.

**server.port**

Type : Integer
Mandatory : Yes

Defines port in which the service must launched.

**server.paths.home**

Type : String
Mandatory : Yes

Defines home page link of the service

**server.paths.documentation**

Type : String
Mandatory : Yes

Defines documentation page link of service

NB : Documentation page is not again done at 100%

**server.paths.connection**

Type : String
Mandatory : Yes

Defines link in which the client can send POST request in order to simulate loading page.

**server.paths.test**

Type : String
Mandatory : Yes

Defines test page link which allows user to simulate POST request.

**server.directoryTemporaryFile**

Type : String
Mandatory : Yes

Page html simulation is not possible without saving it on server. Indeed, Chromium allows only to load url or path of html file. Therefore, all html pages sent by client to the service will be stored temporarily before any loading. Once those are useless, the service remove them.

NB : The path mentionned on directoryTemporaryFile must exist

**request.maxPostParametersSize**

Type : String
Mandatory : Yes

Limit maximum authorized POST request size that the client can send.

# 5. Browsers management

An id is attached for each browser. In terms of the id, the service calls the adequate Chromium. If there is no Chromium found, it create a new instance of Chromium. An id is defined according to three following features :

- host of connected url
- proxy used
- args injected natively to Chromium

So, if you have two distinct urls http://www.site.com/chemin1 and http://www.site.com/chemin2 but they have the same host and you need that these links will use the same proxy and the same args, so, they will be loaded on the same instance of Chromium. The one will be loaded in first tab and the second on second tab.

# 6. Technology

The service was written on javascript version ES6 wich is based on NodeJs. All HTTP protocoles are piloted by Express.js. Browsers controling is done by puppeter library.

# 7. Installation

- Clone the project from Git
- Run command line

```sh
$ npm install
```

This command permits to clone and install all dependencies.
NB : Chromium browser will be installed too

# 8. Start

- Edit the configuration.json file which is found at src/main/resources according to context especially the web service port
- Run command line
 
```sh
$ node index
```
- If all thing si done correctly,  the web service home page will be reachable from browser.