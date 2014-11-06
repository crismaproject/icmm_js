function IcmmSettings (icmmApiUrl, d) {
    'use strict';
    var icmmApi, domain, listeners;
    domain = d || 'CRISMA';
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
    this.setDomain = function (dom) {
        this.domain = dom;
    };
    this.addApiListener = function (callback) {
        listeners.push(callback);
    };
}
angular.module(
    'de.cismet.crisma.ICMM.config',
    []
).provider(
    'de.cismet.crisma.ICMM.config.IcmmSettings',
    function IcmmSettingsProvider () {
        'use strict';
        var icmmApi, domain;
        icmmApi = 'foo';
        domain = 'CRISMA';
        this.setInitialIcmmApi = function (url) {
            icmmApi = url;
        };
        this.setInitialDomain = function (d) {
            domain = d;
        };
        this.$get = [
            '$q',
            function cmmSettingsFactory () {
                return new IcmmSettings(icmmApi, domain);
            }
        ];
    }
);