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
                }
            ]
            ));
    
    afterEach(function() {
        $http.verifyNoOutstandingExpectation();
    });

    
    it('should create dataitem with given ids', function() {
        var apiurl = "http://dummydomain.com/icmmapi";
        
        $http.expectGET(apiurl + "/CRISMA.dataitems?limit=999999999")
             .respond(200, JSON.stringify({"$collection": [{"$ref": "/CRISMA.dataitems/52"}]}));
     
        icmm.createICCDataItem(apiurl, 'foo', 'bar', 'iccdatavector', 1, 2).then(function(data) {
            // we do compare the timestamp
            delete data.lastmodified;
            expect(data).toEqual({
                        '$self': '/CRISMA.dataitems/53',
                        'name': 'foo',
                        'description': 'bar',
                        'datadescriptor': {
                            '$ref': '/CRISMA.datadescriptors/2'
                        },
                        'actualaccessinfocontenttype': 'application/json',
                        'actualaccessinfo': '"iccdatavector"',
                        'categories': [{
                            '$ref': '/CRISMA.categories/1'
                        }]
                    }
                );
        });
        $http.flush();
        $http.verifyNoOutstandingRequest();
    });
    
    it('should create dataitem with default ids', function() {
        var apiurl = "http://dummydomain.com/icmmapi";
        
        $http.expectGET(apiurl + "/CRISMA.categories?filter=key:icc_data&limit=1")
             .respond(200, JSON.stringify({"$collection": [{"$ref": "/CRISMA.categories/42"}]}));
        $http.expectGET(apiurl + "/CRISMA.datadescriptors?filter=name:ICC+Data+Vector+descriptor&limit=1")
             .respond(200, JSON.stringify({"$collection": [{"$ref": "/CRISMA.datadescriptors/13"}]}));
        $http.expectGET(apiurl + "/CRISMA.dataitems?limit=999999999")
             .respond(200, JSON.stringify({"$collection": [{"$ref": "/CRISMA.dataitems/52"}]}));
     
        icmm.createICCDataItem(apiurl, 'foo', 'bar', 'iccdatavector').then(function(data) {
            // we do compare the timestamp
            delete data.lastmodified;
            expect(data).toEqual({
                        '$self': '/CRISMA.dataitems/53',
                        'name': 'foo',
                        'description': 'bar',
                        'datadescriptor': {
                            '$ref': '/CRISMA.datadescriptors/13'
                        },
                        'actualaccessinfocontenttype': 'application/json',
                        'actualaccessinfo': '"iccdatavector"',
                        'categories': [{
                            '$ref': '/CRISMA.categories/42'
                        }]
                    }
                );
        });
        $http.flush();
        $http.verifyNoOutstandingRequest();
    });
    
    it('should fail create dataitem', function() {
        var apiurl = "http://dummydomain.com/icmmapi";
        
        $http.expectGET(apiurl + "/CRISMA.categories?filter=key:icc_data&limit=1")
             .respond(200, JSON.stringify({"$collection": []}));
        $http.whenGET(apiurl + "/CRISMA.datadescriptors?filter=name:ICC+Data+Vector+descriptor&limit=1")
             .respond(200, JSON.stringify({"$collection": []}));
        $http.whenGET(apiurl + "/CRISMA.dataitems?limit=999999999")
             .respond(200, JSON.stringify({"$collection": [{"$ref": "/CRISMA.dataitems/52"}]}));
     
        icmm.createICCDataItem(apiurl, 'foo', 'bar', 'iccdatavector').catch(function(err) {
            expect(err).toEqual('cannot find id of ICC dataitem default category');
        });

        $http.flush();
    });
});