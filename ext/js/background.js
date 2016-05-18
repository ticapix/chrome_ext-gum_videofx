var videofx_files = ["fx_3dcube.js", "fx_null.js", 'fx_shader01.js']

function updateTabIcon(tab, enabled) {
    var path = enabled ? "../res/icon_on.png" : "../res/icon_off.png"
    chrome.pageAction.setIcon({
        tabId: tab.id,
        path: path
    });
}

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
    log.debug('domain', domain)
    return domain;
}

function getDebugFlag() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get({
            debug: false
        }, function(items) {
            resolve(items.debug);
        });
    });
}

function setDebugFlag(flag) {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.set({
            debug: flag ? true : false // quick sanitisation
        }, function() {
            resolve();
        });
    });
}

function getSelectedPluginIndex() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get({
            default_fx_index: 0
        }, function(items) {
            resolve(items.default_fx_index);
        });
    });
}

function setSelectedPluginIndex(index) {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.set({
            default_fx_index: parseInt(index)
        }, function() {
            resolve();
        });
    });
}

function getCurrentActiveTab() {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({
            active: true, // Select active tabs
            // currentWindow: true
            lastFocusedWindow: true // In the current window
        }, function(tabs) {
            if (tabs.length === 0) {
                log.error('tabs', tabs)
                reject("expecting at least one active tab")
            }
            resolve(tabs[0])
        });
    })
}

function isExtEnabledForTab(tab) {
    return new Promise(function(resolve, reject) {
        if (tab.url === undefined) {
            reject(new Error('tab.url is not defined'));
        }
        let domain = extractDomain(tab.url);
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
            reject(new Error('tab.url is not defined'))
        }
        var domain = extractDomain(tab.url);
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

function loadFileAsString(url) {
    url = '/effects/' + url
    log.debug('load url', url)
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
var background_handler = (function() {
    return {
        setPageActionIconActive: function() {
            return getCurrentActiveTab().then(function(tab) {
                // set icon active
                chrome.pageAction.show(tab.id);
                // and update the user preference settings
                isExtEnabledForTab(tab).then(function(enabled) {
                    updateTabIcon(tab, enabled);
                })
            })
        },
        isExtensionEnableForCurrentTab: function() {
            return getCurrentActiveTab().then(function(tab) {
                return isExtEnabledForTab(tab)
            })
        },
        getAllEffectsAsStringArray: function() {
            return new Promise(function(resolve, reject) {
                var effects = []
                var promises = []
                videofx_files.forEach(function(filename) {
                    promises.push(loadFileAsString(filename).then(function(code) {
                        effects.push(code);
                    }));
                })
                Promise.all(promises).then(function() {
                    resolve(effects);
                });
            })
        },
        getDebugFlag: getDebugFlag,
        getSelectedPluginIndex: getSelectedPluginIndex,
        loadFileAsString: loadFileAsString
    }
})();
chrome.runtime.onMessage.addListener(function(rpc, sender, sendResponse) {
    log.debug('RPC calling on background', rpc.fct_name, 'with args', rpc.args);
    background_handler[rpc.fct_name].apply(null, rpc.args).then(function(response) {
        log.debug('RPC background returning', response);
        sendResponse(response)
    });
    return true;
});
// debug storage content
chrome.storage.local.get(function(items) {
    log.debug('storage.local', items)
});
chrome.storage.sync.get(function(items) {
    log.debug('storage.sync', items)
});