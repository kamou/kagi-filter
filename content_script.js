
const browserInstance = typeof browser !== 'undefined' ? browser : chrome;
browserInstance.runtime.sendMessage({action: "updateHostList"}, (response) => {
    console.log("Response:", response);
});

function filterContent() {
    const parentElement = document.getElementById('layout-v2');
    if (parentElement) {
        const hostnames = Array.from(parentElement.querySelectorAll('span.host'))
                               .map(hostSpan => hostSpan.textContent.trim());

        browserInstance.runtime.sendMessage({action: "checkHostsInList", hostnames: hostnames}, (response) => {
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
}

// Call filterContent initially to handle already loaded content
filterContent();

// MutationObserver to observe changes within the page and filter content accordingly
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            filterContent();
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Disconnect the observer when leaving the page
window.onunload = () => {
    observer.disconnect();
};
