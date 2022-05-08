 # PowerShell Interactor Browser Extension
 
This is a minimal example of a browser extension that allows a Web application
or site to interact with PowerShell running locally on the host system.

I need some help resolving the issue described below. I tried to make it as 
easy as possible to run this example; I've even provided a simple web server
that runs the web app with no configuration necessary.

This design may be useful for extensions that show a nice feature rich popup
page, and it's the main UI the user interacts with. However, this isn't a
good setup to support arbitrary web pages communicating with the extension.
I need some help on what direction to take to support the latter scenario.

The sequence diagram below shows which particular browser API's were used to
communicate between the components.

### Sequence Diagram

```console
+---------+       +---------+       +---------+   |   +------------+
| webpage | <---> |"middle" | <---> |  worker | <-|-> | powershell |
+---------+       +---------+       +---------+   |   +------------+
  Web App         : . . . . Extension . . . . :   |   Host Platform
     :                  :                :                  :
runtime.sendMessage()-> :                :                  :
     :                  :                :                  :
     :     navigator.serviceWorker       :                  :
     :              .controller          :                  :
     :              .postMessage() ----> :                  :
     :                  :                :                  :
     :                  :     runtime.connectNative()       :
     :                  :            .postMessage() ------> :
     :                  :                :         stdin -> :
     :                  :                :<-------------- stdout
     :                  :<--------- MessageChannel          :
     :                  :            .postMessage()         :
     :<------------ callback()           :                  :

```
### Components
|Component|File|Description|
|---------|----|-----------|
|webpage  |`website\app-script.js`|The script in the page the user interacts with.|
|"middle" |`extension\extension.js`|The go-between for the webpage and background service worker.|
|worker   |`extension\background.js`|The background service worker that interacts with PowerShell.|
|powershell|`pshost\host.ps1`|A PowerShell process started by the browser and connected via Native Messaging.|

### Sequence
* The webpage sends a message along with a response callback to the middle 
  component using `chrome.runtime.sendMessage()`.
* The middle component's `runtime.onMessageExternal` listener receives the 
  message. It then creates a `MessageChannel` to pass to the worker so it can
  receive the response later. One port of this channel is passed along with the
  message to the worker.
* The worker receives the message and port via its `window.onmessage` listener.
  It then sends the message to the native host, and recieves the host's 
  response. 
* The response is passed from the worker back to the middle component through
  the `MessageChannel` port shared by the two.
* The middle component then passes the response to the webpage via the callback
  the webpage provided with the initial request.

## Supported Scenario
  
 This solution works under a specific scenario: the extension popup is 
 displayed.
 
 A webpage can communicate with the service worker via the popup. The popup 
 page has a `<script>` reference to a JavaScript file implementing the message
 passing between webpage and service worker.
 
  ## Problem
 
I want my web app to be able to indirectly send and receive data to/from the 
PowerShell process via these other components at any time. This should work
when there are no extension windows (popup/context) showing.

As it is now, I have to use the DevTools Inspector on the extension's popup
to force it to stay active while I test the web app.

## Solutions?

I'm looking for any approach that lets my web app (web page) access the 
background service worker on demand to communicate with PowerShell.

One approach I tried involved finding a way to keep one page within the 
extension loaded, but not visible. I thought that maybe the `sandbox` field in
`manifest.json` could accomplish this, but I didn't have any luck. I tried 
importing the webpage facing script of the extension into the background 
service worker, but wasn't sure how to proceed since I'd have to redo the 
messaging passing between the middle script and web page. Plus the service
worker may not stay loaded - so same problem I have with the "middle" component
put inside the popup.

The next direction I'll likely take is a content page approach with injecting
Javascript into the browser's active window. Maybe the API's used could be 
be the same, or similar, to what's in between "middle" and worker in the
sequence diagram now. I think that's unlikely though...

## Setup

The steps to get this to run on a Windows system are relatively easy:

* On Windows, add registry entry for the host process:
  * `HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tweedle.examplehost`
  * Set its `REG_SZ` value to the absolute path of the host's manifest file.
    For example, 
    `C:\Users\todd_\projects\example-extension\pshost\manifest.json` 
* Load the unpacked extension in Chrome or MS Edge and make a note of its ID 
  once loaded. The ID will look something like, 
  `ibmjbffabdgooobjlmgbpabpknndpgdn`.
* In the file, `\pshost\manifest.json`, update the `"allowed_origins"` field
  with the extension's ID.
  * Also update the `"path"` field with the absolute path to the batch file,
    `\pshost\runhost.bat`.
* In `\website\app-script.js`, `line: 4`, update the extension ID.
* Open a command shell console and `cd` in to the `\website` folder and run
  the `webserver.py` script. Then open your browser to `http://localhost:4040`

After the set up is done, open the browser to the local site. The page has one
button on it that sends a request and recevies a response.

* Right-mouse-click the loaded extension icon and select `Inspect popup` to open
  the DevTools Inspector. This will force the extension's popup page to stay 
  loaded.
* Set breakpoints in the listeners or other interesting points in code.
* Press the button and observe the effects.
* The PS host produces a log in its own folder, `log.txt` that can be checked to
  make sure it's receiving and sending.
## New Approach

After some reading and experimentation, I've found a workable solution to 
support communication between the components.

<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" contentScriptType="application/ecmascript" contentStyleType="text/css" height="601px" preserveAspectRatio="none" style="width:429px;height:601px;background:#FFFFFF;" version="1.1" viewBox="0 0 429 601" width="429px" zoomAndPan="magnify"><defs/><g><rect fill="#DDDDDD" height="582.8828" style="stroke:#A80036;stroke-width:1.0;" width="79" x="1" y="6"/><text fill="#000000" font-family="sans-serif" font-size="13" font-weight="bold" lengthAdjust="spacing" textLength="51" x="15" y="19.4951">browser</text><rect fill="#DDDDDD" height="582.8828" style="stroke:#A80036;stroke-width:1.0;" width="207" x="117" y="6"/><text fill="#000000" font-family="sans-serif" font-size="13" font-weight="bold" lengthAdjust="spacing" textLength="62" x="189.5" y="19.4951">extension</text><rect fill="#DDDDDD" height="582.8828" style="stroke:#A80036;stroke-width:1.0;" width="89" x="334" y="6"/><text fill="#000000" font-family="sans-serif" font-size="13" font-weight="bold" lengthAdjust="spacing" textLength="53" x="352" y="19.4951">platform</text><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:5.0,5.0;" x1="40" x2="40" y1="58.9609" y2="594.8828"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:5.0,5.0;" x1="151" x2="151" y1="58.9609" y2="594.8828"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:5.0,5.0;" x1="275" x2="275" y1="58.9609" y2="594.8828"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:5.0,5.0;" x1="378" x2="378" y1="58.9609" y2="594.8828"/><rect fill="#FEFECE" height="31.6094" style="stroke:#A80036;stroke-width:1.5;" width="71" x="5" y="26.3516"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacing" textLength="57" x="12" y="47.8848">webpage</text><rect fill="#FEFECE" height="31.6094" style="stroke:#A80036;stroke-width:1.5;" width="61" x="121" y="26.3516"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacing" textLength="47" x="128" y="47.8848">content</text><rect fill="#FEFECE" height="31.6094" style="stroke:#A80036;stroke-width:1.5;" width="89" x="231" y="26.3516"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacing" textLength="75" x="238" y="47.8848">background</text><rect fill="#FEFECE" height="31.6094" style="stroke:#A80036;stroke-width:1.5;" width="81" x="338" y="26.3516"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacing" textLength="67" x="345" y="47.8848">powershell</text><line style="stroke:#A80036;stroke-width:1.0;" x1="40.5" x2="82.5" y1="91.3125" y2="91.3125"/><line style="stroke:#A80036;stroke-width:1.0;" x1="82.5" x2="82.5" y1="91.3125" y2="104.3125"/><line style="stroke:#A80036;stroke-width:1.0;" x1="41.5" x2="82.5" y1="104.3125" y2="104.3125"/><polygon fill="#A80036" points="51.5,100.3125,41.5,104.3125,51.5,108.3125" style="stroke:#A80036;stroke-width:1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="89" x="47.5" y="86.4561">dispatchEvent()</text><polygon fill="#A80036" points="139.5,130.6641,149.5,134.6641,139.5,138.6641" style="stroke:#A80036;stroke-width:1.0;"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:2.0,2.0;" x1="40.5" x2="145.5" y1="134.6641" y2="134.6641"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="73" x="47.5" y="129.8076">getList event</text><line style="stroke:#A80036;stroke-width:1.0;" x1="151.5" x2="193.5" y1="165.0156" y2="165.0156"/><line style="stroke:#A80036;stroke-width:1.0;" x1="193.5" x2="193.5" y1="165.0156" y2="178.0156"/><line style="stroke:#A80036;stroke-width:1.0;" x1="152.5" x2="193.5" y1="178.0156" y2="178.0156"/><polygon fill="#A80036" points="162.5,174.0156,152.5,178.0156,162.5,182.0156" style="stroke:#A80036;stroke-width:1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="54" x="158.5" y="160.1592">connect()</text><polygon fill="#A80036" points="263.5,204.3672,273.5,208.3672,263.5,212.3672" style="stroke:#A80036;stroke-width:1.0;"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:2.0,2.0;" x1="151.5" x2="269.5" y1="208.3672" y2="208.3672"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="96" x="158.5" y="203.5107">onConnect event</text><line style="stroke:#A80036;stroke-width:1.0;" x1="151.5" x2="193.5" y1="238.7188" y2="238.7188"/><line style="stroke:#A80036;stroke-width:1.0;" x1="193.5" x2="193.5" y1="238.7188" y2="251.7188"/><line style="stroke:#A80036;stroke-width:1.0;" x1="152.5" x2="193.5" y1="251.7188" y2="251.7188"/><polygon fill="#A80036" points="162.5,247.7188,152.5,251.7188,162.5,255.7188" style="stroke:#A80036;stroke-width:1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="86" x="158.5" y="233.8623">postMessage()</text><polygon fill="#A80036" points="263.5,278.0703,273.5,282.0703,263.5,286.0703" style="stroke:#A80036;stroke-width:1.0;"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:2.0,2.0;" x1="151.5" x2="269.5" y1="282.0703" y2="282.0703"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="100" x="158.5" y="277.2139">request message</text><line style="stroke:#A80036;stroke-width:1.0;" x1="275.5" x2="317.5" y1="312.4219" y2="312.4219"/><line style="stroke:#A80036;stroke-width:1.0;" x1="317.5" x2="317.5" y1="312.4219" y2="325.4219"/><line style="stroke:#A80036;stroke-width:1.0;" x1="276.5" x2="317.5" y1="325.4219" y2="325.4219"/><polygon fill="#A80036" points="286.5,321.4219,276.5,325.4219,286.5,329.4219" style="stroke:#A80036;stroke-width:1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="89" x="282.5" y="307.5654">connectNative()</text><line style="stroke:#A80036;stroke-width:1.0;" x1="275.5" x2="317.5" y1="355.7734" y2="355.7734"/><line style="stroke:#A80036;stroke-width:1.0;" x1="317.5" x2="317.5" y1="355.7734" y2="368.7734"/><line style="stroke:#A80036;stroke-width:1.0;" x1="276.5" x2="317.5" y1="368.7734" y2="368.7734"/><polygon fill="#A80036" points="286.5,364.7734,276.5,368.7734,286.5,372.7734" style="stroke:#A80036;stroke-width:1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="86" x="282.5" y="350.917">postMessage()</text><polygon fill="#A80036" points="366.5,395.125,376.5,399.125,366.5,403.125" style="stroke:#A80036;stroke-width:1.0;"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:2.0,2.0;" x1="275.5" x2="372.5" y1="399.125" y2="399.125"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="28" x="282.5" y="394.2686">stdin</text><polygon fill="#A80036" points="286.5,425.4766,276.5,429.4766,286.5,433.4766" style="stroke:#A80036;stroke-width:1.0;"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:2.0,2.0;" x1="280.5" x2="377.5" y1="429.4766" y2="429.4766"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="36" x="292.5" y="424.6201">stdout</text><line style="stroke:#A80036;stroke-width:1.0;" x1="233.5" x2="275.5" y1="459.8281" y2="459.8281"/><line style="stroke:#A80036;stroke-width:1.0;" x1="233.5" x2="233.5" y1="459.8281" y2="472.8281"/><line style="stroke:#A80036;stroke-width:1.0;" x1="233.5" x2="274.5" y1="472.8281" y2="472.8281"/><polygon fill="#A80036" points="266.5,468.8281,276.5,472.8281,266.5,476.8281" style="stroke:#A80036;stroke-width:1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="86" x="189.5" y="454.9717">postMessage()</text><polygon fill="#A80036" points="162.5,499.1797,152.5,503.1797,162.5,507.1797" style="stroke:#A80036;stroke-width:1.0;"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:2.0,2.0;" x1="156.5" x2="274.5" y1="503.1797" y2="503.1797"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="87" x="168.5" y="498.3232">message event</text><line style="stroke:#A80036;stroke-width:1.0;" x1="109.5" x2="151.5" y1="533.5313" y2="533.5313"/><line style="stroke:#A80036;stroke-width:1.0;" x1="109.5" x2="109.5" y1="533.5313" y2="546.5313"/><line style="stroke:#A80036;stroke-width:1.0;" x1="109.5" x2="150.5" y1="546.5313" y2="546.5313"/><polygon fill="#A80036" points="142.5,542.5313,152.5,546.5313,142.5,550.5313" style="stroke:#A80036;stroke-width:1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="89" x="62.5" y="528.6748">dispatchEvent()</text><polygon fill="#A80036" points="51.5,572.8828,41.5,576.8828,51.5,580.8828" style="stroke:#A80036;stroke-width:1.0;"/><line style="stroke:#A80036;stroke-width:1.0;stroke-dasharray:2.0,2.0;" x1="45.5" x2="150.5" y1="576.8828" y2="576.8828"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacing" textLength="87" x="57.5" y="572.0264">response event</text><!--MD5=[9216dcbc9d417ac5acbdd616b7644cc7]
@startuml communication

skinparam style strictuml
'skinparam monochrome reverse

box browser
    participant webpage as W
end box
box extension
    participant content as C
    participant background as B
end box
box platform
    participant powershell as P
end box

W -> W: dispatchEvent()
W - -> C: getList event

C -> C: connect()
C - -> B: onConnect event
C -> C: postMessage()
C - -> B: request message

B -> B: connectNative()
B -> B: postMessage()
B - -> P: stdin
B <- - P: stdout

B <- B: postMessage()
C <- - B: message event

C <- C: dispatchEvent()
W <- - C: response event

@enduml

@startuml communication

skinparam style strictuml

box browser
    participant webpage as W
end box
box extension
    participant content as C
    participant background as B
end box
box platform
    participant powershell as P
end box

W -> W: dispatchEvent()
W - -> C: getList event

C -> C: connect()
C - -> B: onConnect event
C -> C: postMessage()
C - -> B: request message

B -> B: connectNative()
B -> B: postMessage()
B - -> P: stdin
B <- - P: stdout

B <- B: postMessage()
C <- - B: message event

C <- C: dispatchEvent()
W <- - C: response event

@enduml

PlantUML version 1.2022.0(Tue Jan 11 08:16:42 PST 2022)
(GPL source distribution)
Java Runtime: OpenJDK Runtime Environment
JVM: OpenJDK 64-Bit Server VM
Default Encoding: Cp1252
Language: en
Country: US
--></g></svg>

