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

            createICCDataItem = function (name, description, indicatorVector, domain, datadescriptorId, categoryId) {
                return {
                    'name': name,
                    'description': description,
                    'lastmodified': new Date().toISOString(),
                    'datadescriptor': {
                        '$ref': '/' + domain + '.datadescriptors/' + datadescriptorId
                    },
                    'actualaccessinfocontenttype': 'application/json',
                    'actualaccessinfo': JSON.stringify(indicatorVector),
                    'categories': [{
                        '$ref': '/' + domain + '.categories/' + categoryId
                    }]
                };
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