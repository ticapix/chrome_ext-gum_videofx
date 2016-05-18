function background(fct_name) {
    var rpc = {
        fct_name: fct_name,
        args: Array.prototype.slice.call(arguments)
    };
    rpc.args.shift();
    return new Promise(function(resolve, reject) {
        chrome.runtime.sendMessage(rpc, function(response) {
            var lastError = chrome.runtime.lastError;
            if (lastError) {
                log.error('RPC', fct_name, lastError.message);
                reject(lastError.message);
                return;
            }
            resolve(response);
        });
    });
}
// to call webpage, we need to call contentscript first
function webpage() {
    var rpc = {
        fct_name: 'webpage',
        args: Array.prototype.slice.call(arguments),
        id: '_' + Math.random().toString(36).substr(2, 9)
    };
    return new Promise(function(resolve, reject) {
        return getCurrentActiveTab().then(function(tab) {
            chrome.tabs.sendMessage(tab.id, rpc, function(response) {
                var lastError = chrome.runtime.lastError;
                if (lastError) {
                    log.error('RPC', fct_name, lastError.message);
                    reject(lastError.message);
                    return;
                }
                resolve(response);
            });
        });
    });
}
