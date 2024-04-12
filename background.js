let dbVers = 6;
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        console.log(`opening indexed DB with version ${dbVers}`);
        const request = indexedDB.open("MaliciousHostsDB", dbVers);

        request.onupgradeneeded = function(event) {
            console.log('upgrading indexed DB');
            const db = event.target.result;
            if (db.objectStoreNames.contains('hosts')) {
                db.deleteObjectStore('hosts');
            }
            console.log('creating hosts object store!')
            db.createObjectStore('hosts');
        };

        request.onsuccess = function(event) {
        console.log('opening indexed DB success');
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            console.log('opening indexed DB fail');
            reject(event.target.error);
        };
    });
}

async function retrieveHostFile() {
    const db = await openIndexedDB();
    const transaction = db.transaction(['hosts'], 'readonly');
    const store = transaction.objectStore('hosts');

    const request = store.get('hostsList');
    console.log('request:', request);

    request.onsuccess = function() {
        if (request.result) {
            console.log('HostList content:', request.result);
        } else {
            console.log('HostList data not found');
        }
    };

    request.onerror = function(event) {
        console.error('Error retrieving the hostList:', event.target.error);
    };
}

async function checkHostsInList(hostnames) {
    const db = await openIndexedDB();
    const transaction = db.transaction(['hosts'], 'readonly');
    const store = transaction.objectStore('hosts');
    const request = store.get('hostsList');

    return new Promise((resolve, reject) => {
        request.onsuccess = function() {
            if (request.result) {
                const listArray = request.result.split('\n').map(host => host.trim());
                const listSet = new Set(listArray);
                const blockedHosts = hostnames.filter(hostname => listSet.has(hostname));
                console.log(blockedHosts);
                resolve(blockedHosts);
            } else {
                resolve([]);
            }
        };

        request.onerror = function(event) {
            reject(new Error('Failed to retrieve the host list.'));
        };
    });
}


async function storeHostFile() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/tif.txt');
        const data = await response.text();

        const db = await openIndexedDB();
        const transaction = db.transaction(['hosts'], 'readwrite');
        const store = transaction.objectStore('hosts');

        const request = store.put(data, "hostsList");

        request.onsuccess = () => {
            console.log('Entire host list stored successfully.');
            retrieveHostFile();
        };

        request.onerror = (event) => {
            console.error('Failed to store the host list: ', event.target.error);
        };
    } catch (error) {
        console.error('Failed to fetch the host list: ', error);
    }
}


console.log('calling addListener!');
const browserInstance = typeof browser !== 'undefined' ? browser : chrome;
browserInstance.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('inside addListener!');
    if (request.action === "updateHostList") {
        storeHostFile().then(() => {
            console.log('success true gro!');
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.toString() });
        });
        return true;
    }
    if (request.action === "checkHostsInList") {
        checkHostsInList(request.hostnames).then(blockedHosts => {
            sendResponse({ blockedHosts });
        }).catch(error => {
            sendResponse({ blockedHosts: [], error: error.toString() });
        });
        return true;
    }
});
