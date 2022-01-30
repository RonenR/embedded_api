// When in the wrapper - this should be placed at the head.
//   When in embedded - should be placed at the end of the body? Can it be in the head as well? Can it be used as a module? To be tested...

window.wsGlobals = window.wsGlobals || {};

const embeddedApi = {

    API_IDENTIFIER_MESSAGE: "embedded_api_window",
    HANDSHAKE_MESSAGE: "loaded:embedded_component",
    WRAPPER_ID: "98s7vkjh",
    EMBEDDED_ID: "kjhdfn",
    ACTION_TYPE_DATA: "ACTION_TYPE_DATA",
    ACTION_TYPE_REQUEST: "ACTION_TYPE_REQUEST",

    connectedWindow: null,
    connectedWindowApi: null,
    actions: {},
    isWrapper: null,

    init: function () {

        // set 'isWrapper':
        if (window.top===window) {
            this.isWrapper = true;
        } else {
            this.isWrapper = false;
            // Post message to top parent host, to initiate connection:
            // Assumes wrapper has this initiated already before building the iframe. ie -> should be in the head.
            window.top.postMessage(this.HANDSHAKE_MESSAGE, "*");
        }

        // set 'connectedWindow':
        if (!this.isWrapper) {
            this.connectedWindow = window.top;
        } else {
            try {
                this.connectedWindow = document.querySelector('iframe').contentWindow;
            } catch (e) {
                this.connectedWindow = null;
            }
        }

        window.addEventListener("message", (event) => {
            console.log('got message: ', event);
            let message = event.data;
            
            if (message == this.HANDSHAKE_MESSAGE) {
                this.connectedWindow = document.querySelector('iframe').contentWindow;
            } else if (message.type === this.ACTION_TYPE_DATA) {
                this._updateStateWith(message.data);
            } else if (message.type === this.ACTION_TYPE_REQUEST) {
                this._onRequest(message.data);
            } 
        }, false);
    },

    sendDataToConnectedWindow: function (data) {
        let message = {
            type: this.ACTION_TYPE_DATA,
            data: data
        }
        this.connectedWindow().postMessage(message, "*");
    },
    
    /// param is string. Can be colon separated if another param is needed.
    requestParamFromConnectedWindow: function (param) {
        let message = {
            type: this.ACTION_TYPE_REQUEST,
            data: param
        }
        this.connectedWindow().postMessage(message, "*");
    },

    /// param is string. Can be colon separated if another param is needed. Supports keypath nesting by dot.
    _onRequest: function (param) {
        if (param.startsWith("ping")) {
            try {
                let payload = param.split(":")[1];
                console.log('got ping: ', payload);
            } catch (e) {
                
            }
        } else {
            if (window.wsGlobals && window.wsGlobals.PageState) {
                let data = {};
                if (param!=="*") {
                    data[param] = window.wsGlobals.PageState.getParam(param);
                } else {
                    data = window.wsGlobals.PageState.pageState;
                }
                this.sendDataToConnectedWindow(data);
            }
        }
    },

    _updateStateWith: function(newPartialState) {
        if (newPartialState && window.wsGlobals && window.wsGlobals.PageState ) {
            window.wsGlobals.PageState.updatePageStateWithParams({byConnectedWindow: newPartialState});
        }
    },
}

embeddedApi.init();
window.wsGlobals.embeddedApi = embeddedApi;
exports.embeddedApi = embeddedApi;