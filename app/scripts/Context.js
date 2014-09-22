function Context (icmmApiUrl) {
    var icmm_api, domain, listeners;
    domain = 'CRISMA';
    listeners = [];
    icmm_api = icmmApiUrl;
    this.getIcmmApi = function () {
        return icmm_api;
    };
    this.getDomain = function () {
        return domain;
    };
    this.setIcmmApi = function (url) {
        var i;
        icmm_api = url;
        for (i = 0; i < listeners.length; i++) {
            listeners[i]();
        }
    };
    this.addApiListener = function (callback) {
        listeners.push(callback);
    };
}
angular.module('de.cismet.crisma.ICMM.config', []).provider('Context',
    function ContextProvider () {
        var icmm_api = 'foo';
        this.setInitialIcmmApi = function (url) {
            icmm_api = url;
        };

        this.$get = ['$q', function contextFactory ($q) {
                return new Context(icmm_api);
            }];
    }
);