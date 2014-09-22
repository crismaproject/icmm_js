angular.module('de.cismet.crisma.ICMM.Worldstates', ['ngResource', 'de.cismet.crisma.ICMM.config']).factory('de.cismet.crisma.ICMM.Worldstates', [
    '$resource',
    'Context',
    function ($resource, Context) {
        'use strict';
        var augmentWorldstateWithICCData = function (worldstate) {
            var oldIndicators;
            oldIndicators = worldstate.iccdata;
            oldIndicators.renderingDescriptor = [
                {
                    gridWidth: 'col-sm-12',
                    priority: 1,
                    displayHeader: true,
                    sortable: false,
                    fullSize: true,
                    collapsed: false,
                    collapsible: true,
                    bodyDirective: 'icc-data-body',
                    headerDirective: 'icc-data-header',
                    colourClasses: [
                        'panel-purple',
                        'panel-orange',
                        'panel-greenLight',
                        'panel-blue',
                        'panel-redLight'
                    ],
                    mergeId: 'iccIndicatorCriteriaWidget',
                    title: 'Indicator & Criteria'
                },
                {
                    gridWidth: 'col-sm-12',
                    priority: 0,
                    displayHeader: true,
                    sortable: false,
                    fullSize: true,
                    collapsed: false,
                    collapsible: true,
                    bodyDirective: 'mini-indicator-body',
                    colourClasses: [
                        'txt-color-blue',
                        'txt-color-purple',
                        'txt-color-greenDark',
                        'txt-color-orange',
                        'txt-color-redLight'
                    ],
                    widgetArea: false
                }
            ];
            oldIndicators.categories = [{
                    '$self': '/CRISMA.categories/2',
                    'id': 2,
                    'key': 'Indicators',
                    'classification': {
                        '$self': '/CRISMA.classifications/2',
                        'id': 2,
                        'key': 'ICC_DATA'
                    }
                }];
            worldstate.iccdata = [oldIndicators];
            return worldstate;
        }, augmentWorldstateDataWithRenderingDescriptors = function (worldstate) {
            var renderingDescriptorPrototype = {
                gridWidth: 'col-sm-6',
                priority: 1,
                displayHeader: true,
                sortable: true,
                fullSize: true,
                collapsed: false,
                collapsible: true,
                bodyDirective: 'wms-leaflet',
                padding: 'no-padding'
            }, dataslot, i, tempRd;
            if (worldstate.worldstatedata) {
                for (i = 0; i < worldstate.worldstatedata.length; i++) {
                    dataslot = worldstate.worldstatedata[i];
                    tempRd = Object.create(renderingDescriptorPrototype);
                    tempRd.title = dataslot.name;
                    tempRd.priority = i + 2;
                    dataslot.renderingdescriptor = [];
                    dataslot.renderingdescriptor.push(tempRd);
                }
            }
        }, mergeWMSLayer = function (worldstate) {
            var osmMergeId = 'osmHelperLayer';
            var regionMergeId = 'regionHelperLayer';
            var backgroundMergeId = 'backgroundHelperLayer';
            var i, renderingdescriptor, dataslot;
            if (!worldstate.worldstatedata) {
                return;
            }
            for (i = 0; i < worldstate.worldstatedata.length; i++) {
                renderingdescriptor = worldstate.worldstatedata[i].renderingdescriptor[0];
                dataslot = worldstate.worldstatedata[i];
                switch (dataslot.name) {
                    case 'planet_osm_polygon':
                    case 'ortho':
                    case 'planet_osm_line':
                    case 'planet_osm_point':
                        renderingdescriptor.mergeId = osmMergeId;
                        renderingdescriptor.priority = 20;
                        break;
                    case 'regione':
                    case 'province':
                    case 'comune_aq':
                    case 'hospitals':
                    case 'schools':
                    case 'power_towers':
                        renderingdescriptor.mergeId = regionMergeId;
                        renderingdescriptor.priority = 30;
                        break;
                    case 'contour_dem_25':
                    case 'zones':
                    case 'clc2006':
                        renderingdescriptor.mergeId = backgroundMergeId;
                        renderingdescriptor.priority = 40;
                        break;
                }
            }
        }, processResult = function (worldstateData) {
            if (!worldstateData) {
                return null;
            }
            var worldstate = JSON.parse(worldstateData);
            augmentWorldstateWithICCData(worldstate);
            augmentWorldstateDataWithRenderingDescriptors(worldstate);
            mergeWMSLayer(worldstate);
            return worldstate;
        }, processResults = function (worldstates) {
            var worldstatesArr = JSON.parse(worldstates).$collection, i;
            for (i = 0; i < worldstatesArr.length; i++) {
                augmentWorldstateWithICCData(worldstatesArr[i]);
                augmentWorldstateDataWithRenderingDescriptors(worldstatesArr[i]);
            }
            return worldstatesArr;
        }, Worldstate = $resource(Context.getIcmmApi() + '/' + 'CRISMA' + '.worldstates/:wsId', {
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
        }), WorldstateFacade = {
            'get': function () {
                return Worldstate.get.apply(this, arguments);
            },
            'query': function () {
                return Worldstate.query.apply(this, arguments);
            },
            'remove': function () {
                return Worldstate.remove.apply(this, arguments);
            },
            'delete': function () {
                return Worldstate.delete.apply(this, arguments);
            },
        }, worldstateUtils = function () {
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
        Context.addApiListener(function () {
            Worldstate = $resource(Context.getIcmmApi() + '/' + 'CRISMA' + '.worldstates/:wsId', {
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
        });
        WorldstateFacade.utils = worldstateUtils();
        return WorldstateFacade;
    }
]);