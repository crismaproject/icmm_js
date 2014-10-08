angular.module(
    'de.cismet.crisma.ICMM.services',
    [
        'ngResource'
    ]
).factory(
    'de.cismet.crisma.ICMM.services.icmm',
    [
        '$q',
        '$resource',
        function ($q, $resource) {
            'use strict';

            var createICCDataItem, getNextId, convertToCorrectIccDataFormat;

            createICCDataItem = function (apiurl, name, description, indicatorVector, categoryId, datadescriptorId) {
                var catResource, ddResource, deferredCatId, deferredDDId, deferredResult;

                deferredCatId = $q.defer();
                deferredDDId = $q.defer();
                deferredResult = $q.defer();

                if (categoryId) {
                    deferredCatId.resolve(categoryId);
                } else {
                    // we assume that the category with the default key is present

                    catResource = $resource(apiurl + '/CRISMA.categories', {limit: '1', filter: 'key:icc_data'},
                        {
                            'query': {method: 'GET', isArray: true, transformResponse: function (data) {
                                // we strip the ids of the objects only
                                var col, res, i;

                                col = JSON.parse(data).$collection;
                                res = [];

                                for (i = 0; i < col.length; ++i) {
                                    res.push(col[i]);
                                }

                                return res;
                            }}
                        });
                    catResource.query().$promise.then(function (data) {
                        if (data.length === 1) {
                            deferredCatId.resolve(data[0].$ref.substr(data[0].$ref.lastIndexOf('/') + 1));
                        } else {
                            deferredCatId.reject('cannot find id of ICC dataitem default category');
                        }
                    });
                }

                if (datadescriptorId) {
                    deferredDDId.resolve(datadescriptorId);
                } else {
                    // we assume that the datadescriptor with the default name is present

                    ddResource = $resource(apiurl + '/CRISMA.datadescriptors', {limit: '1', filter: 'name:ICC Data Vector descriptor'},
                        {
                            'query': {method: 'GET', isArray: true, transformResponse: function (data) {
                                // we strip the ids of the objects only
                                var col, res, i;

                                col = JSON.parse(data).$collection;
                                res = [];

                                for (i = 0; i < col.length; ++i) {
                                    res.push(col[i]);
                                }

                                return res;
                            }}
                        });
                    ddResource.query().$promise.then(function (data) {
                        if (data.length === 1) {
                            deferredDDId.resolve(data[0].$ref.substr(data[0].$ref.lastIndexOf('/') + 1));
                        } else {
                            deferredDDId.reject('cannot find id of ICC dataitem default datadescriptor');
                        }
                    });
                }

                $q.all([

                    getNextId(apiurl, '/CRISMA.dataitems'),
                    deferredCatId.promise,
                    deferredDDId.promise
                ]).then(function (res) {
                    deferredResult.resolve({

                        '$self': '/CRISMA.dataitems/' + res[0],
                        'name': name,
                        'description': description,
                        'lastmodified': new Date().toISOString(),
                        'datadescriptor': {
                            '$ref': '/CRISMA.datadescriptors/' + res[2]
                        },
                        'actualaccessinfocontenttype': 'application/json',
                        'actualaccessinfo': JSON.stringify(indicatorVector),
                        'categories': [{
                            '$ref': '/CRISMA.categories/' + res[1]
                        }]
                    });

                }, function (err) {
                    deferredResult.reject(err);
                });

                return deferredResult.promise;
            };

            getNextId = function (apiurl, classkey) {
                var def, Resource, objects;

                def = $q.defer();
                Resource = $resource(apiurl + classkey, {limit: '999999999'},
                    {
                        'query': {method: 'GET', isArray: true, transformResponse: function (data) {
                            // we strip the ids of the objects only
                            var col, res, i;

                            col = JSON.parse(data).$collection;
                            res = [];

                            for (i = 0; i < col.length; ++i) {
                                res.push(col[i]);
                            }

                            return res;
                        }}
                    });
                objects = Resource.query();
                objects.$promise.then(function (data) {
                    var i, id, maxId;

                    maxId = 0;

                    for (i = 0; i < data.length; ++i) {
                        id = parseInt(data[i].$ref.substr(data[i].$ref.lastIndexOf('/') + 1), 10);
                        if (id > maxId) {
                            maxId = id;
                        }
                    }
                    def.resolve(maxId + 1);
                });

                return def.promise;
            };

            convertToCorrectIccDataFormat = function (worldstate) {
                var i, iccData, oldIndicators, indicatorCategoryExists;

                iccData = worldstate.iccdata;

                if (!iccData) {
                    throw new Error('Worldstate has no iccData field. Can not check the indicator format.');
                }
                if (Object.prototype.toString.call(iccData) === '[object Object]') {
                    //we need to check if the categories are correctly set, else we need to augment the iccdata object
                    if (!iccData.categories) {
                        iccData.categories = [{
                            'key': 'Indicators'
                        }];
                    } else {
                        indicatorCategoryExists = false;
                        iccData.categories.forEach(function (c) {
                            if (c && c.key && c.key === 'Indicators') {
                                indicatorCategoryExists = true;
                            }
                        });
                        if (!indicatorCategoryExists) {
                            iccData.categories.push({
                                'key': 'Indicators'
                            });
                        }
                    }
                    worldstate.iccdata = [worldstate.iccdata];
                } else if (Object.prototype.toString.call(iccData) === '[object Array]') {
                    if (iccData.length <= 0) {
                        throw new Error('Worldstate icc data is an empty array.');
                    }
                    // the iccdata object is already a array. We need to check if the indicators are marked with a category
                    // if not we assume the first element of the array represents the indicators
                    iccData.forEach(function (item) {
                        if (item && item.categories) {
                            for (i = 0; i < item.categories.length; i++) {
                                if (item.categories[i].key === 'Indicators') {
                                    oldIndicators = item;
                                }
                            }
                        }
                    });

                    if (!oldIndicators) {
                        worldstate.iccdata[0].categories = [{
                            'key': 'Indicators',
                            'classification': {
                                '$self': '/CRISMA.classifications/2',
                                'id': 2,
                                'key': 'ICC_DATA'
                            }
                        }];
                    }
                }

                return worldstate;
            };

            return {
                createICCDataItem: createICCDataItem,
                getNextId: getNextId,
                convertToCorrectIccDataFormat:convertToCorrectIccDataFormat
            };
        }
    ]
);