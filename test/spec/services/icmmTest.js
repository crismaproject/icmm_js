'use strict';

describe('icmmTest', function () {
    var icmm, $http;
    
    // load the controller's module
    beforeEach(function(){
        module('de.cismet.crisma.ICMM.services');
    });
    
    beforeEach(inject(
            [
                'de.cismet.crisma.ICMM.services.icmm',
                '$httpBackend',
                function(service, http) {
                    icmm = service;
                    $http = http;
                    console.log(icmm);
                    console.log(http);
                }
            ]
            ));
    
    afterEach(function() {
        $http.verifyNoOutstandingExpectation();
        $http.verifyNoOutstandingRequest();
    });

    
    it('should create dataitem', function() {
        var apiurl = "http://dummydomain.com/icmmapi";
        
        $http.expectGET(apiurl + "/CRISMA.dataitems?limit=999999999").respond(200, JSON.stringify({"$collection": []}));
        icmm.createICCDataItem(apiurl, 'foo', 'bar', 'iccdatavector', 1, 2).then(function(data) {
           console.log(data);
        });
        $http.flush();
    });
});