angular.module(
    'de.cismet.cids.rest.collidngNames.Nodes',
    [
        'ngResource'
    ]
).factory(
    'de.cismet.collidingNameService.Nodes',
    [
        '$resource',
        '$timeout',
        'CRISMA_ICMM_API',
        'CRISMA_DOMAIN',
        function ($resource, $timeout, CRISMA_ICMM_API, CRISMA_DOMAIN) {
            'use strict';
            var transformResults, transformSingleResult, Nodes, utils;
            
            transformSingleResult = function(ws){
                var hasChilds, node, that, getChildrenFunc = function (callback) {
                    that = this;
                    $timeout(function () {
                        Nodes.children({filter: 'parentworldstate.id:' + Nodes.utils.getRequestIdForNodeKey(that.key)}, callback);
                    }, 1000);
                };
                if (!ws) {
                    return null;
                }
                hasChilds = (ws.childworldstates && ws.childworldstates.length > 0) ? true : false;
                var parent = ws.parentworldstate, nodeKey = [ws.id];
                while (parent && parent.parentworldstate) {
                    nodeKey.push(parent.id);
                    parent = parent.parentworldstate;
                }
                if(parent){
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
//                  object: ws,
                    // we augment the node object of the rest api with a method how the children are generated
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
            Nodes = $resource(
                CRISMA_ICMM_API + '/nodes',
                {nodeId: '@id', domain: CRISMA_DOMAIN},
                {
                    //belongs to the GET /nodes/{domain}.{nodekey} action of the icmm api
                    get: {
                        method: 'GET',
                        params: {deduplicate: true},
                        url: CRISMA_ICMM_API + '/' + CRISMA_DOMAIN + '.worldstates/' + ':nodeId?omitNullValues=false&deduplicate=true',
                        transformResponse: function (data) {
                            var ws;
                            if (!data) {
                                return null;
                            }
                            ws = JSON.parse(data);
                            return transformSingleResult(ws);
                        }
                    },
                // belongs to the /nodes action of the icmm api
                    query: {
                        method: 'GET',
                        isArray: true,
                        url: CRISMA_ICMM_API + '/' + CRISMA_DOMAIN + '.worldstates?limit=100&offset=0&level=1&filter=parentworldstate%3Anull&omitNullValues=false&deduplicate=true',
                        transformResponse: function (data) {
                            return transformResults(data);
                        }
                    },
                    children: {
                        method: 'GET',
                        isArray: true,
                        params: {level: 2},
                        url: CRISMA_ICMM_API + '/' + CRISMA_DOMAIN + '.worldstates',
                        transformResponse: function (data) {
                            return transformResults(data);
                        },
                        //belongs to post /nodes/{domain}/children
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
                        url: CRISMA_ICMM_API + '/' + CRISMA_DOMAIN + '.worldstates?level=5&filter=childworldstates:\\[\\]&omitNullValues=false&deduplicate=true',
                        transformResponse: function (data) {
                            return transformResults(data);
                        }
                    }
                }
            );
        
            utils = {
                getRequestIdForWorldstate: function (worldstate) {
                    return worldstate.id;
                },
                getRequestIdForNodeKey : function(nodeKey){
                    if(nodeKey.indexOf('.') > -1){
                        return nodeKey.substring(nodeKey.lastIndexOf('.')+1,nodeKey.length);
                    }
                    return nodeKey;
                }
            };
            Nodes.utils = utils;
            return Nodes;
        }
    ]
);
