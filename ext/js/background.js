var videofx_files = ["js/fx_3dcube.js", "js/fx_null.js"]

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    } else {
        domain = url.split('/')[0];
    }
    //find & remove port number
    domain = domain.split(':')[0];
    return domain;
}
// function updateIcon(tab) {
//     var path = 'res/icon32g.png'
//     if (is_enabled) {
//         path = 'res/icon32.png'
//     }
//     chrome.browserAction.setIcon({
//         path: path
//     });
//     if (tab !== undefined) {
//         chrome.tabs.reload(tab.id)
//     }
// }
function getCurrentActiveTab() {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({
            active: true, // Select active tabs
            // currentWindow: true
            lastFocusedWindow: true // In the current window
        }, function(tabs) {
            if (tabs.length === 0) {
                error('tabs', tabs)
                reject("expecting at least one active tab")
            }
            resolve(tabs[0])
        });
    })
}

function isExtEnabledForTab(tab) {
    return new Promise(function(resolve, reject) {
        if (tab.url === undefined) {
            reject('tab.url is not defined')
        }
        var domain = extractDomain(tab.url)
        debug('domain', domain)
        chrome.storage.local.get({
            domains: []
        }, function(items) {
            resolve(items.domains.indexOf(domain) === -1)
        });
    });
}

function setExtEnabledForTab(tab, enabled) {
    return new Promise(function(resolve, reject) {
        if (tab.url === undefined) {
            reject('tab.url is not defined')
        }
        var domain = extractDomain(tab.url)
        debug('domain', domain)
            // 1. get current listed domains
        chrome.storage.local.get({
            domains: []
        }, function(items) {
            // 2. if domain enabled, no need to store it -> remove it from the array
            if (enabled) {
                var idx = items.domains.indexOf(domain)
                if (idx >= 0) {
                    items.domains.splice(idx, 1)
                }
            } else { // adding domain to the list
                items.domains.push(domain)
            }
            // 3. saving new list of domain
            chrome.storage.local.set(items, function() {
                resolve();
            });
        });
    });
}

function updateTabIcon(tab) {
    isExtEnabledForTab(tab).then(function(enabled) {
        var path = enabled ? "res/icon_on.png" : "res/icon_off.png"
        chrome.browserAction.setIcon({
            path: path
        });
    });
}

function loadFileAsString(url) {
    debug('load url', url)
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function(evt) {
            if (evt.currentTarget.readyState === 4 && evt.currentTarget.status === 200) {
                resolve(evt.currentTarget.responseText)
            }
        };
        xhr.send(null);
    })
}
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    debug('message', message)
    if (message.get_file !== undefined) {
        loadFileAsString(message.get_file).then(function(code) {
            sendResponse(code);
        })
    } else if (message.get_videofx_files !== undefined) {
        sendResponse(videofx_files)
    } else if (message.is_enabled_for_current_tab !== undefined) {
        getCurrentActiveTab().then(function(tab) {
            isExtEnabledForTab(tab).then(function(enabled) {
                sendResponse({
                    enabled: enabled,
                    domain: extractDomain(tab.url)
                })
            })
        })
    } else if (message.enable_for_current_tab !== undefined) {
        getCurrentActiveTab().then(function(tab) {
            setExtEnabledForTab(tab, message.enable_for_current_tab).then(function() {
                updateTabIcon(tab)
            })
        })
    } else if (message.get_videofx_details !== undefined) {
        var details = {
            videofx: []
        }
        for (var fx_name in window.videofx) {
            details.videofx.push(fx_name)
            details[fx_name] = fx_name;
        }
        debug('sending details', details)
        sendResponse(details)
    } else {
        debug('this is not a known message', message);
    }
    return true;
});
chrome.tabs.onActivated.addListener(function(activeInfo) {
    getCurrentActiveTab().then(function(tab) {
        updateTabIcon(tab)
    });
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url !== undefined && tab.active === true) {
        updateTabIcon(tab)
    }
});
getCurrentActiveTab().then(function(tab) {
    updateTabIcon(tab)
});
// debug
chrome.storage.local.get(function(items) {
    debug('storage.local', items)
});
chrome.storage.sync.get(function(items) {
    debug('storage.sync', items)
});
// redefine webfx_defineModule
webfx_defineAppModule = webfx_defineModule.bind(window);
// load plugin to get their info
var fx_promises = [];
for (var fx of videofx_files) {
    fx_promises.push(inject_script(fx));
}
Promise.all(fx_promises).then(function() {
    debug('done loading plugins data in', window.videofx)
});