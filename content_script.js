
chrome.runtime.sendMessage({action: "updateHostList"}, (response) => {
    console.log("Response:", response);
});


window.onload = function() {
    const parentElement = document.getElementById('layout-v2');
    if (parentElement) {
        const hostnames = Array.from(parentElement.querySelectorAll('span.host'))
                               .map(hostSpan => hostSpan.textContent.trim());

        chrome.runtime.sendMessage({action: "checkHostsInList", hostnames: hostnames}, (response) => {
            if (response && response.blockedHosts && response.blockedHosts.length > 0) {
                response.blockedHosts.forEach(blockedHost => {
                    const elementToRemove = Array.from(parentElement.children).find(child => {
                        const hostSpan = child.querySelector('span.host');
                        return hostSpan && hostSpan.textContent.trim() === blockedHost;
                    });
                    if (elementToRemove) {
                        parentElement.removeChild(elementToRemove);
                    }
                });
            }
        });
    }
};
