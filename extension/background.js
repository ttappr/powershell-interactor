let nativePort = null;

// Receive messages from other scripts.
self.addEventListener('message', (event) => {
    if (nativePort === null) {
        nativePort = chrome.runtime.connectNative('com.tweedle.examplehost');
    }
    let requestPort = event.ports[0];

    // Receive messages from native host.
    nativePort.onMessage.addListener((message) => {
        // Pass message back to the page.
        requestPort.postMessage(message);    
    });

    // React to port disconnection with host.
    nativePort.onDisconnect.addListener((event) => {
        nativePort = null;
        console.warn('Native host port disconnected...');
        requestPort.postMessage('Native host port disconnected...');
    });
    
    // Send response back to middle component.
    nativePort.postMessage(event.data);
});


// The magic connection - the other side of the path.
chrome.runtime.onConnect.addListener((port) => {
    port.postMessage({from_background: "we did it!!"});
});