
const NATIVE_HOST = 'com.tweedle.examplehost';

let nativePort  = null;
let contentPort = null;

// Register listener for connection events coming from content scripts.
// This approach is needed to wake up the dormant Service Worker to handle
// message events.

chrome.runtime.onConnect.addListener((port) => {
    contentPort = port;

    // Register listener for messages coming from the content script.
    contentPort.onMessage.addListener((message) => {
        if (nativePort === null) {
            // Start and connect to the native host.
            nativePort = chrome.runtime.connectNative(NATIVE_HOST);

            // Add handler for messages from the native host.
            nativePort.onMessage.addListener((message) => {

                // Send message (response) back to content script.
                contentPort.postMessage(message);
            });

            nativePort.onDisconnect.addListener((e) => {
                nativePort = null;
            });
        }

        // Send request message to native host.
        nativePort.postMessage(message);
    });
});

