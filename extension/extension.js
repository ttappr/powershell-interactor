
let servicePort = null;

// Register to receive message events from the webpage scripts.
window.addEventListener('outgoingMessage', (e) => {
    if (servicePort === null) {
        // Wakes up the Service Worker and establishes a connection via the 
        // port.
        servicePort = chrome.runtime.connect({name: "ServiceWorkerPort"});

        // Register to receive messages from the Service Worker.
        servicePort.onMessage.addListener((message) => {

            // Pass message along to webpage scripts using a message event.
            let e = new CustomEvent('incomingMessage', {detail: message});
            window.dispatchEvent(e);
        });
    }
    // Pass message along to Service Worker.
    servicePort.postMessage(e.detail);
});
