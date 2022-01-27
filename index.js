// When in the wrapper - this should be placed at the head.
//   When in embedded - should be placed at the end of the body? Can it be in the head as well? Can it be used as a module? To be tested...

window.wsGlobals = window.wsGlobals || {};

const HANDSHAKE_MESSAGE = "loaded:embedded_component";
const WRAPPER_ID = "98s7vkjh";
const EMBEDDED_ID = "kjhdfn";

const EmbeddedApi = {

    connectedWindowApi: null,

    actions: {},

    getId: function () {
        if (EmbeddedApi.isWrapper()) {
            return WRAPPER_ID;
        } else {
            return EMBEDDED_ID;
        }
    },

    isWrapper: function () {
        return window.top===window;
    },

    isConnected: function () {
        return Boolean(EmbeddedApi.connectedWindowApi);
    },

    setConnectedWindowApi: function (apiObj) {
        EmbeddedApi.connectedWindowApi = apiObj;
        apiObj.setConnectedWindowApi(EmbeddedApi);
        console.log('got window api: ', apiObj);
    },

    /// Useful for handshake, testing the 2 way connection.
    reflect: function(reflectedMethod, param) {
        try {
            return EmbeddedApi.connectedWindowApi[reflectedMethod](param);
        } catch (e) {
            return null;
        }
    },

    // Supports keyPath - dot separated keys.
    getStateParam: function(keyPath) {
        if (window.wsGlobals && window.wsGlobals.PageState ) {
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
        if (newPartialState && window.wsGlobals && window.wsGlobals.PageState ) {
            window.wsGlobals.PageState.updatePageStateWithParams({byConnectedWindow: newPartialState});
        }
    },

    // The connected window can request this to see which actions are possible.
    getActions: function () {
        return { ...EmbeddedApi.actions};
    },

    // Intended for the window to expose public actions for the connected window to act on it.
    addAction: function (key, method) {
        EmbeddedApi.actions[key] = method;
    },

    /// Run a method exposed by the window to the EmbeddedApi.
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


if (EmbeddedApi.isWrapper()) {
    window.addEventListener("message", (event) => {
        console.log('got message: ', event);
        if (event.data==HANDSHAKE_MESSAGE) {
            let embeddedWindow = document.querySelector('iframe').contentWindow;
            console.log('got embedded window: ', embeddedWindow.wsGlobals);
            if (embeddedWindow) {
                try {
                    let iframedWindowApi = embeddedWindow.wsGlobals.EmbeddedApi;
                    EmbeddedApi.setConnectedWindowApi(iframedWindowApi);
                    iframedWindowApi.setConnectedWindowApi(EmbeddedApi);

                    let reflected = iframedWindowApi.reflect("getId");
                    if (reflected === EmbeddedApi.getId()) {
                        console.log('hand shake successful');
                    } else {
                        console.log('hand shake error');
                    }
                } catch (e) {
                    console.log('hand shake error - exception: ' + e);
                }
            }
        }
    }, false);
} else {
    // Post message to top parent host, to initiate connection:
    window.top.postMessage(HANDSHAKE_MESSAGE, "*");
}

exports.EmbeddedApi = EmbeddedApi;