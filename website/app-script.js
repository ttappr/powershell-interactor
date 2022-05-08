function sendRequest() {
    let rsp = document.querySelector('#response');
    chrome.runtime.sendMessage(
                        'ibmjbffabdgooobjlmgbpabpknndpgdn',
                        'GET_MESSAGE_CMD',
                        (response) => {
                            rsp.innerText = JSON.stringify(response)
                        });
}
