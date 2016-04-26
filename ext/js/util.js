function debug() {
    Array.prototype.unshift.call(arguments, typeof _ext_short_name !== 'undefined' ? _ext_short_name : '-');
    console.log.apply(console, arguments);
}

function define_module(name, module) {
    if (window.modules === undefined) {
        window.modules = {};
    }
    debug('module', name, module)
    window.modules[name] = module;
}