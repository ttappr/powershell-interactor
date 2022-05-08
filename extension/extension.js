
// Receive message from web page and send request to service worker.
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    let channel = new MessageChannel();

    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
    
    channel.port1.onmessage = (event) => {
        sendResponse(event.data);
    }
});
