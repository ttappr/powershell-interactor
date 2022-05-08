 # PowerShell Interactor Browser Extension
 
 This is a minimal example of a browser extension that allows a Web application
 or site to interact with PowerShell running locally on the host system.

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
Components
* webpage - The page or app the user interacts with.
* "middle" - The go-between for the webpage and background service worker.
* worker - The background service worker that interacts with the PS process.
* powershell - A PowerShell process started by the browser that uses the 
               Native Messaging to provide operations in the context of the 
               host platform.

 
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
messaging passing between the middle script and web page.

## Setup

The steps to get this to run on a Windows system are easy:

* On Windows, add registry entry for the host process:
  * `HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tweedle.examplehost`
  * Set its `REG_SZ` value to the absolute path of batch file 
    `\pshost\runhost.bat`
* Set up Web server to host files in `\website`.
  * Give it a nameless URL like `http:\\localhost:4000` - it has to match the 
    filters in the manifest files.
* Load the unpacked extension in Chrome or MS Edge and make a note of its ID 
  once loaded.
* Update the `"allowed_origins"` field in `\pshost\manifest.json` with the 
  extension's ID.

After the set up is done, open the browser to the local site. The page has one
button on it that sends a request and recevies a response.
* Open browser to `http:\\localhost:4000`
* Right-mouse-click the loaded extension icon and select `Inspect` to open the
  DevTools Inspector. This will force the extension's popup page to stay loaded.
* Set breakpoints in the listeners or other interesting points in code.
* Press the button.
* The PS host produces a log in its own folder, `log.txt` that can be checked to
  make sure it's receiving and sending.