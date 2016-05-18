function main() {
    var reload_text = document.querySelector('#reload_text')
    var reload_btn = document.querySelector('#reload_btn')
    var fxenabled_check = document.querySelector('#fxenabled_check');
    var debug_check = document.querySelector('#debug_check');
    var domain_text = document.querySelector('#domain_text');
    var videofx_lst = document.querySelector('#videofx_lst');
    var options_ctn = document.querySelector('#options_ctn')
    reload_btn.addEventListener('click', function(event) {
        return getCurrentActiveTab().then(function(tab) {
            if (tab !== undefined) {
                chrome.tabs.reload(tab.id);
                window.location.reload();
            }
        });
    });
    // bind click on the debug switch
    debug_check.addEventListener('click', function(event) {
        setDebugFlag(debug_check.checked);
        reload_text.style.display = 'block';
    });
    getDebugFlag().then(function(flag) {
        debug_check.checked = flag;
    });
    // bind click on the on/off switch
    fxenabled_check.addEventListener('click', function(event) {
        options_ctn.style.display = fxenabled_check.checked ? 'block' : 'none';
        return getCurrentActiveTab().then(function(tab) {
            return setExtEnabledForTab(tab, fxenabled_check.checked).then(function() {
                reload_text.style.display = 'block';
            });
        });
    });
    // update the switch value with user preference
    getCurrentActiveTab().then(function(tab) {
        if (tab === undefined) {
            domain_text.textContent = "<no active tab>";
            Promise.reject(new Error("no active tab"));
        }
        domain_text.textContent = extractDomain(tab.url);
        return isExtEnabledForTab(tab).then(function(enabled) {
            fxenabled_check.checked = enabled;
            options_ctn.style.display = fxenabled_check.checked ? 'block' : 'none';
        })
    });
    // // add list of available plugin
    webpage('getAllEffectDetails').then(function(effects) {
        return background('getSelectedPluginIndex').then(function(fx_index) {
            for (let index = 0; index < effects.length; ++index) {
                let li = document.createElement('li');
                let input = document.createElement('input');
                input.setAttribute('type', 'radio');
                input.setAttribute('name', 'videofx');
                input.setAttribute('value', index);
                input.setAttribute('id', 'fx_' + index);
                input.checked = index === fx_index;
                li.appendChild(input);
                let label = document.createElement('label');
                label.setAttribute('for', 'fx_' + index);
                var icon = document.createElement('img');
                icon.setAttribute('src', effects[index].icon_url);
                label.appendChild(icon);
                label.appendChild(document.createTextNode(effects[index].name))
                li.appendChild(label);
                var option = document.createElement('div')
                option.appendChild(document.createTextNode(effects[index].description))
                li.appendChild(option)
                videofx_lst.appendChild(li);
            }
        })
    }).then(function() {
        var radios = document.querySelectorAll('input[type=radio][name="videofx"]');
        Array.prototype.forEach.call(radios, function(radio) {
            radio.addEventListener('change', function(event) {
                let fx_index = parseInt(event.target.value)
                setSelectedPluginIndex(fx_index);
                webpage('updateEffectIndex', fx_index);
            });
        });
    })
}
document.addEventListener('DOMContentLoaded', function() {
    main();
});