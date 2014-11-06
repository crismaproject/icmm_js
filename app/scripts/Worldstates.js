angular.module(
    'de.cismet.crisma.ICMM.Worldstates',
    [
        'ngResource',
        'de.cismet.crisma.ICMM.config'
    ]
    ).factory(
    'de.cismet.crisma.ICMM.Worldstates',
    [
        '$resource',
        'de.cismet.crisma.ICMM.config.IcmmSettings',
        function ($resource, IcmmSettings) {
            'use strict';
            var processResult, processResults, worldstate, worldstateUtils, worldstateFacade, createWorldstateResource;
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

            createWorldstateResource = function () {
                var r;
                r = $resource(IcmmSettings.getIcmmApi() + '/' + IcmmSettings.getDomain() + '.worldstates/:wsId', {
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
                return r;
            };
            worldstate = createWorldstateResource();

            worldstateFacade = {
                'get': function () {
                    return worldstate.get.apply(this, arguments);
                },
                'query': function () {
                    return worldstate.query.apply(this, arguments);
                },
                'remove': function () {
                    return worldstate.remove.apply(this, arguments);
                },
                'delete': function () {
                    return worldstate.delete.apply(this, arguments);
                }
            };

            IcmmSettings.addApiListener(function () {
                worldstate = createWorldstateResource();
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
                            if (iccdata[j] && iccdata[j].categories) {
                                for (k = 0; k < iccdata[j].categories.length && !data; ++k) {
                                    if (forCriteria && 'Criteria' === iccdata[j].categories[k].key) {
                                        data = iccdata[j];
                                    } else if (!forCriteria && 'Indicators' === iccdata[j].categories[k].key) {
                                        data = iccdata[j];
                                    }
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
            
            worldstateFacade.utils = worldstateUtils();
            return worldstateFacade;
        }
    ]
    );
