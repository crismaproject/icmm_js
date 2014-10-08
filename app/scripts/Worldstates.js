angular.module(
    'de.cismet.crisma.ICMM.Worldstates',
    [
        'ngResource'
    ]
    ).factory(
    'de.cismet.crisma.ICMM.Worldstates',
    [
        '$resource',
        'CRISMA_ICMM_API',
        'CRISMA_DOMAIN',
        function ($resource, CRISMA_ICMM_API, CRISMA_DOMAIN) {
            'use strict';
            var processResult, processResults, worldstate, worldstateUtils ;

            processResult = function (worldstateData) {
                if (!worldstateData) {
                    return null;
                }
                var worldstate = JSON.parse(worldstateData);
                return worldstate;
            };
            
            processResults = function (worldstates) {
                var worldstatesArr = JSON.parse(worldstates).$collection;
                return worldstatesArr;
            };
            
            worldstate = $resource(CRISMA_ICMM_API + '/' + CRISMA_DOMAIN + '.worldstates/:wsId', {
                wsId: '@id',
                deduplicate: false,
                level: '5',
                omitNullValues: 'false'
            }, {
                'get': {
                    method: 'GET',
                    transformResponse: processResult
                },
                'query': {
                    method: 'GET',
                    isArray: true,
                    params: {
                        level: '1',
                        omitNullValues: 'true'
                    },
                    transformResponse: processResults
                }
            });
            
            worldstateUtils = function () {
                var publicApi;
                publicApi = {};
                publicApi.stripIccData = function (worldstates, forCriteria) {
                    var data, dataVector, i, iccdata, j, k, worldstate;
                    dataVector = [];
                    for (i = 0; i < worldstates.length; ++i) {
                        worldstate = worldstates[i];
                        iccdata = worldstate.iccdata;
                        data = null;
                        for (j = 0; j < iccdata.length && !data; ++j) {
                            for (k = 0; k < iccdata[j].categories.length && !data; ++k) {
                                if (forCriteria && 'Criteria' === iccdata[j].categories[k].key) {
                                    data = iccdata[j];
                                } else if (!forCriteria && 'Indicators' === iccdata[j].categories[k].key) {
                                    data = iccdata[j];
                                }
                            }
                        }
                        if (!data) {
                            throw 'worldstate without proper icc data:' + worldstate;
                        }
                        dataVector.push({
                            name: worldstate.name,
                            data: JSON.parse(data.actualaccessinfo)
                        });
                    }
                    return dataVector;
                };
                return publicApi;
            };
            worldstate.utils = worldstateUtils();
            return worldstate;
        }
    ]
);
