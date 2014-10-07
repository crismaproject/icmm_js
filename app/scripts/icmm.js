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

            var createICCDataItem, getNextId;

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
                    throw err;
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

            return {
                createICCDataItem: createICCDataItem,
                getNextId: getNextId
            };
        }
    ]
);