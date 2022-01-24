// When in the wrapper - this should be placed at the head.
//   When in embedded - should be placed at the end of the body? Can it be in the head as well? Can it be used as a module? To be tested...

window.wsGlobals = window.wsGlobals || {};

const HANDSHAKE_MESSAGE = "loaded:embedded_component";
const WRAPPER_ID = "98s7vkjh";

/// For the hosting window:
let WrapperApi = {
    wasHandShakeSuccess: false,

    embedded: null,

    getWrapperId: function () {
        return WRAPPER_ID;
    },

    getUser: function() {
        if (window.wsGlobals && window.wsGlobals.PageState && window.wsGlobals.PageState.pageState ) {
            return window.wsGlobals.PageState.pageState.user;
        } else {
            return null;
        }
    },

    // Supports keyPath - dot separated keys.
    getStateParam: function(keyPath) {
        if (window.wsGlobals && window.wsGlobals.PageState && window.wsGlobals.PageState.pageState ) {
            if (keyPath==="*") {
                return {...window.wsGlobals.PageState.pageState};
            } else {
                return window.wsGlobals.PageState.getParam(keyPath);
            }
        } else {
            return null;
        }
    },

    updateStateWith: function(newPartialState) {
        if (newPartialState && window.wsGlobals && window.wsGlobals.PageState && window.wsGlobals.PageState.pageState ) {
            window.wsGlobals.PageState.updatePageStateWithParams(newPartialState);
        }
    },
}

window.addEventListener("message", (event) => {
    console.log('got message: ', event);
    if (event.data==HANDSHAKE_MESSAGE) {
        let embeddedWindow = document.querySelector('iframe').contentWindow;
        //debugger;
        if (embeddedWindow) {
            try {
                embeddedWindow.wsGlobals.EmbeddedApi.setWrapperApi(WrapperApi);
                let reflectionMethod = "getWrapperId";
                let reflected = embeddedWindow.wsGlobals.EmbeddedApi.reflect(reflectionMethod);
                console.log('reflected: ', reflected);
                if (reflected === WrapperApi[reflectionMethod]()) {
                    console.log('hand shake successful');
                    WrapperApi.wasHandShakeSuccess = true;
                    WrapperApi.embedded = embeddedWindow.wsGlobals.EmbeddedApi;
                } else {
                    console.log('hand shake error');
                    WrapperApi.wasHandShakeSuccess = false;
                }
            } catch (e) {
                console.log('hand shake error - exception: ' + e);
                WrapperApi.wasHandShakeSuccess = false;
            }
        }
    }
}, false);

/// For the embedded window:
let EmbeddedApi = {
    wrapper: null,

    actions: {},

    // The host can request this to see which actions are possible.
    getActions: function () {
        return { ...EmbeddedApi.actions};
    },

    // Intended for the embedded window to expose public actions for the host to act on it.
    addAction: function (key, method) {
        EmbeddedApi.actions[key] = method;
    },

    foo: function (param) {
        console.log('got param: ', param);
    },

    setWrapperApi: function (apiObj) {
        this.wrapper = apiObj;
        console.log('got window api: ', apiObj);
    },

    reflect: function(reflectedMethod, param) {
        try {
            return this.wrapper[reflectedMethod](param);
        } catch (e) {
            return null;
        }
    },

    // Supports keyPath - dot separated keys.
    getStateParam: function(keyPath) {
        if (window.wsGlobals && window.wsGlobals.PageState && window.wsGlobals.PageState.pageState ) {
            return window.wsGlobals.PageState.getParam(keyPath);
        } else {
            return null;
        }
    },

    updateStateWith: function(newPartialState) {
        if (newPartialState && window.wsGlobals && window.wsGlobals.PageState && window.wsGlobals.PageState.pageState ) {
            window.wsGlobals.PageState.updatePageStateWithParams(newPartialState);
        }
    },

    ///
    act: function (methodName, paramsArray) {
        let method;
        if (EmbeddedApi.actions && EmbeddedApi.actions[methodName] && EmbeddedApi.actions[methodName] instanceof Function) {
            method = EmbeddedApi.actions[methodName];
        }

        if (method) {
            try {
                method(...paramsArray);
            } catch (e) {

            }
        }
    }
}

// Has to be public in window so the wrapper can call it on message:
window.wsGlobals.EmbeddedApi = EmbeddedApi;
// Has to be global so we can use it in browser code.. Do we need this even when not browserified?? TODO: consider...
window.wsGlobals.WrapperApi = WrapperApi;

// Broadcast the following message upon loaded, so the wrapper knows we're loaded and can
//   respond by sending us the WrapperApi object.
if (window.top!==window) {
    // We're embedded - so - post message to top parent host:
    window.top.postMessage(HANDSHAKE_MESSAGE, "*");
}

exports.WrapperApi = WrapperApi;
exports.EmbeddedApi = EmbeddedApi;