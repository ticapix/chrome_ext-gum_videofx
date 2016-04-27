//var application_name = chrome.runtime.getManifest().short_name;
// chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//     if (message.injectSpecific) {
//         var filename = "js/fx_3dcube.js";
//         chrome.tabs.executeScript(sender.tab.id, {
//             file: filename
//         }, function() {
//             sendResponse({
//                 done: true
//             });
//         });
//         return true; // Required for async sendResponse()
//     }
// });
var videofx = ["js/fx_3dcube.js", "js/fx_null.js"]
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.get_script !== undefined) {
        var url = message.get_script
        debug('url', url)
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function(evt) {
            if (evt.currentTarget.readyState === 4 && evt.currentTarget.status === 200) {
                sendResponse(evt.currentTarget.responseText);
            }
        };
        xhr.send(null);
    } else if (message.get_plugin_scripts !== undefined) {
        sendResponse(videofx)
    }
    return true;
})
chrome.tabs.onActivated.addListener(function(activeInfo) {
        debug('activeInfo', activeInfo)
    })
    // chrome.browserAction.setIcon({
    //     path: 'icon.svg'
    // });
    // chrome.pageAction.setIcon({
    //     path: 'icon.svg'
    // });