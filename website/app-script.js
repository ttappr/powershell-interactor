
// Register for message events coming from the extension content scripts.
window.addEventListener('incomingMessage', (e) => {
    // Display message received.
    let span       = document.querySelector('#response');
    span.innerText = JSON.stringify(e.detail);
});

// Function called when button on webpage is pressed.
function sendRequest(request) {
    // Issue message event visible to extension content scripts.
    let e = new CustomEvent('outgoingMessage', {detail: request});
    window.dispatchEvent(e);
}
