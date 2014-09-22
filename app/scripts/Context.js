function Context(icmmApiUrl) {
    'use strict';
    var icmmApi, domain, listeners;
    domain = 'CRISMA';
    listeners = [];
    icmmApi = icmmApiUrl;
    this.getIcmmApi = function () {
        return icmmApi;
    };
    this.getDomain = function () {
        return domain;
    };
    this.setIcmmApi = function (url) {
        var i;
        icmmApi = url;
        for (i = 0; i < listeners.length; i++) {
            listeners[i]();
        }
    };
    this.addApiListener = function (callback) {
        listeners.push(callback);
    };
}
angular.module('de.cismet.crisma.ICMM.config', []).provider(
    'Context',
    function ContextProvider() {
        'use strict';
        var icmmApi = 'foo';
        this.setInitialIcmmApi = function (url) {
            icmmApi = url;
        };

        this.$get = ['$q', function contextFactory() {
            return new Context(icmmApi);
        }];
    }
);