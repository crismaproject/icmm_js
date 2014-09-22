angular.module('de.cismet.cids.rest.collidngNames.Nodes', ['ngResource', 'de.cismet.crisma.ICMM.config']).factory('de.cismet.collidingNameService.Nodes', [
    '$resource',
    '$timeout',
    'Context',
    function ($resource, $timeout, Context) {
        'use strict';
        var transformResults, transformSingleResult, Nodes, NodesFacade, utils;
        transformSingleResult = function (ws) {
            var hasChilds, node, that, getChildrenFunc = function (callback) {
                that = this;
                $timeout(function () {
                    NodesFacade.children({filter: 'parentworldstate.id:' + NodesFacade.utils.getRequestIdForNodeKey(that.key)}, callback);
                }, 1000);
            };
            if (!ws) {
                return null;
            }
            hasChilds = ws.childworldstates && ws.childworldstates.length > 0 ? true : false;
            var parent = ws.parentworldstate, nodeKey = [ws.id];
            while (parent && parent.parentworldstate) {
                nodeKey.push(parent.id);
                parent = parent.parentworldstate;
            }
            if (parent) {
                nodeKey.push(parent.id);
            }
            node = {
                key: nodeKey.reverse().join('.'),
                name: ws.name,
                classKey: 42,
                objectKey: ws.$self,
                type: 'objectNode',
                org: '',
                dynamicChildren: '',
                clientSort: false,
                derivePermissionsFromClass: false,
                icon: 'glyphicon glyphicon-globe',
                iconFactory: null,
                policy: 'default',
                leaf: !hasChilds,
                isLeaf: !hasChilds,
                getChildren: getChildrenFunc
            };
            return node;
        };
        transformResults = function (data) {
            var col = JSON.parse(data).$collection, res = [], i, node;
            for (i = 0; i < col.length; ++i) {
                node = transformSingleResult(col[i]);
                res.push(node);
            }
            return res;
        };
        Nodes = $resource(Context.getIcmmApi() + '/nodes', {
            nodeId: '@id',
            domain: Context.getDomain()
        }, {
            get: {
                method: 'GET',
                params: {deduplicate: true},
                url: Context.getIcmmApi() + '/' + Context.getDomain() + '.worldstates/' + ':nodeId?omitNullValues=false&deduplicate=true',
                transformResponse: function (data) {
                    var ws;
                    if (!data) {
                        return null;
                    }
                    ws = JSON.parse(data);
                    return transformSingleResult(ws);
                }
            },
            query: {
                method: 'GET',
                isArray: true,
                url: Context.getIcmmApi() + '/' + Context.getDomain() + '.worldstates?limit=100&offset=0&level=1&filter=parentworldstate%3Anull&omitNullValues=false&deduplicate=true',
                transformResponse: function (data) {
                    return transformResults(data);
                }
            },
            children: {
                method: 'GET',
                isArray: true,
                params: {level: 2},
                url: Context.getIcmmApi() + '/' + Context.getDomain() + '.worldstates',
                transformResponse: function (data) {
                    return transformResults(data);
                },
                dynamicChildren: {
                    method: 'POST',
                    url: '',
                    transformResult: function (data) {
                        return transformResults(data);
                    }
                }
            },
            scenarios: {
                method: 'GET',
                isArray: true,
                url: Context.getIcmmApi() + '/' + Context.getDomain() + '.worldstates?level=5&filter=childworldstates:\\[\\]&omitNullValues=false&deduplicate=true',
                transformResponse: function (data) {
                    return transformResults(data);
                }
            }
        });
        utils = {
            getRequestIdForWorldstate: function (worldstate) {
                return worldstate.id;
            },
            getRequestIdForNodeKey: function (nodeKey) {
                if (nodeKey.indexOf('.') > -1) {
                    return nodeKey.substring(nodeKey.lastIndexOf('.') + 1, nodeKey.length);
                }
                return nodeKey;
            }
        };
        NodesFacade = {
            'get': function () {
                return Nodes.get.apply(this, arguments);
            },
            'query': function () {
                return Nodes.query.apply(this, arguments);
            },
            'remove': function () {
                return Nodes.remove.apply(this, arguments);
            },
            'delete': function () {
                return Nodes.delete.apply(this, arguments);
            },
            children: function () {
                 return Nodes.children.apply(this, arguments);
            }
        };
        Context.addApiListener(function (newUrl) {
            Nodes = $resource(Context.getIcmmApi() + '/nodes', {
                nodeId: '@id',
                domain: Context.getDomain()
            }, {
                get: {
                    method: 'GET',
                    params: {deduplicate: true},
                    url: Context.getIcmmApi() + '/' + Context.getDomain() + '.worldstates/' + ':nodeId?omitNullValues=false&deduplicate=true',
                    transformResponse: function (data) {
                        var ws;
                        if (!data) {
                            return null;
                        }
                        ws = JSON.parse(data);
                        return transformSingleResult(ws);
                    }
                },
                query: {
                    method: 'GET',
                    isArray: true,
                    url: Context.getIcmmApi() + '/' + Context.getDomain() + '.worldstates?limit=100&offset=0&level=1&filter=parentworldstate%3Anull&omitNullValues=false&deduplicate=true',
                    transformResponse: function (data) {
                        return transformResults(data);
                    }
                },
                children: {
                    method: 'GET',
                    isArray: true,
                    params: {level: 2},
                    url: Context.getIcmmApi() + '/' + Context.getDomain() + '.worldstates',
                    transformResponse: function (data) {
                        return transformResults(data);
                    },
                    dynamicChildren: {
                        method: 'POST',
                        url: '',
                        transformResult: function (data) {
                            return transformResults(data);
                        }
                    }
                },
                scenarios: {
                    method: 'GET',
                    isArray: true,
                    url: Context.getIcmmApi() + '/' + Context.getDomain() + '.worldstates?level=5&filter=childworldstates:\\[\\]&omitNullValues=false&deduplicate=true',
                    transformResponse: function (data) {
                        return transformResults(data);
                    }
                }
            });
        });
        NodesFacade.utils = utils;
        return NodesFacade;
    }
]);