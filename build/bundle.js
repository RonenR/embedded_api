(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
require("./index");
},{"./index":2}],2:[function(require,module,exports){
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
},{}]},{},[1]);
