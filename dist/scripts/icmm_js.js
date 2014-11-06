function IcmmSettings(icmmApiUrl, d) {
  'use strict';
  var icmmApi, domain, listeners;
  domain = d || 'CRISMA';
  listeners = [];
  icmmApi = icmmApiUrl;
  this.getIcmmApi = function () {
    return icmmApi;
  };
  this.getDomain = function () {
    return domain;
  };
  this.setIcmmApi = function (url) {
    var i;
    icmmApi = url;
    for (i = 0; i < listeners.length; i++) {
      listeners[i]();
    }
  };
  this.setDomain = function (dom) {
    this.domain = dom;
  };
  this.addApiListener = function (callback) {
    listeners.push(callback);
  };
}
angular.module('de.cismet.crisma.ICMM.config', []).provider('de.cismet.crisma.ICMM.config.IcmmSettings', function IcmmSettingsProvider() {
  'use strict';
  var icmmApi, domain;
  icmmApi = 'foo';
  domain = 'CRISMA';
  this.setInitialIcmmApi = function (url) {
    icmmApi = url;
  };
  this.setInitialDomain = function (d) {
    domain = d;
  };
  this.$get = [
    '$q',
    function cmmSettingsFactory() {
      return new IcmmSettings(icmmApi, domain);
    }
  ];
});
angular.module('de.cismet.cids.rest.collidngNames.Nodes', [
  'ngResource',
  'de.cismet.crisma.ICMM.config'
]).factory('de.cismet.collidingNameService.Nodes', [
  '$resource',
  '$timeout',
  'de.cismet.crisma.ICMM.config.IcmmSettings',
  function ($resource, $timeout, IcmmSettings) {
    'use strict';
    var transformResults, transformSingleResult, Nodes, utils, nodesFacade, createNodesResource;
    transformSingleResult = function (ws) {
      var hasChilds, node, that, getChildrenFunc = function (callback) {
          that = this;
          $timeout(function () {
            Nodes.children({ filter: 'parentworldstate.id:' + nodesFacade.utils.getRequestIdForNodeKey(that.key) }, callback);
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
    createNodesResource = function () {
      var r;
      r = $resource(IcmmSettings.getIcmmApi() + '/nodes', {
        nodeId: '@id',
        domain: IcmmSettings.getDomain()
      }, {
        get: {
          method: 'GET',
          params: { deduplicate: true },
          url: IcmmSettings.getIcmmApi() + '/' + IcmmSettings.getDomain() + '.worldstates/' + ':nodeId?omitNullValues=false&deduplicate=true',
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
          url: IcmmSettings.getIcmmApi() + '/' + IcmmSettings.getDomain() + '.worldstates?limit=100&offset=0&level=1&filter=parentworldstate%3Anull&omitNullValues=false&deduplicate=true',
          transformResponse: function (data) {
            return transformResults(data);
          }
        },
        children: {
          method: 'GET',
          isArray: true,
          params: { level: 2 },
          url: IcmmSettings.getIcmmApi() + '/' + IcmmSettings.getDomain() + '.worldstates',
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
          url: IcmmSettings.getIcmmApi() + '/' + IcmmSettings.getDomain() + '.worldstates?level=5&filter=childworldstates:\\[\\]&omitNullValues=false&deduplicate=true',
          transformResponse: function (data) {
            return transformResults(data);
          }
        }
      });
      return r;
    };
    Nodes = createNodesResource();
    nodesFacade = {
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
      'children': function () {
        return Nodes.children.apply(this, arguments);
      }
    };
    IcmmSettings.addApiListener(function () {
      Nodes = createNodesResource();
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
    nodesFacade.utils = utils;
    return nodesFacade;
  }
]);
angular.module('de.cismet.crisma.ICMM.Worldstates', [
  'ngResource',
  'de.cismet.crisma.ICMM.config',
  'de.cismet.crisma.ICMM.services'
]).factory('de.cismet.crisma.ICMM.Worldstates', [
  '$resource',
  'de.cismet.crisma.ICMM.config.IcmmSettings',
  'de.cismet.crisma.ICMM.services.icmm',
  function ($resource, IcmmSettings, Icmm) {
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
          worldstate = Icmm.convertToCorrectIccDataFormat(worldstates[i]);
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
]);
angular.module('de.cismet.crisma.ICMM.services', ['ngResource']).factory('de.cismet.crisma.ICMM.services.icmm', [
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
        catResource = $resource(apiurl + '/CRISMA.categories', {
          limit: '1',
          filter: 'key:icc_data'
        }, {
          'query': {
            method: 'GET',
            isArray: true,
            transformResponse: function (data) {
              // we strip the ids of the objects only
              var col, res, i;
              col = JSON.parse(data).$collection;
              res = [];
              for (i = 0; i < col.length; ++i) {
                res.push(col[i]);
              }
              return res;
            }
          }
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
        ddResource = $resource(apiurl + '/CRISMA.datadescriptors', {
          limit: '1',
          filter: 'name:ICC Data Vector descriptor'
        }, {
          'query': {
            method: 'GET',
            isArray: true,
            transformResponse: function (data) {
              // we strip the ids of the objects only
              var col, res, i;
              col = JSON.parse(data).$collection;
              res = [];
              for (i = 0; i < col.length; ++i) {
                res.push(col[i]);
              }
              return res;
            }
          }
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
          'datadescriptor': { '$ref': '/CRISMA.datadescriptors/' + res[2] },
          'actualaccessinfocontenttype': 'application/json',
          'actualaccessinfo': JSON.stringify(indicatorVector),
          'categories': [{ '$ref': '/CRISMA.categories/' + res[1] }]
        });
      }, function (err) {
        deferredResult.reject(err);
      });
      return deferredResult.promise;
    };
    getNextId = function (apiurl, classkey) {
      var def, Resource, objects;
      def = $q.defer();
      Resource = $resource(apiurl + classkey, { limit: '999999999' }, {
        'query': {
          method: 'GET',
          isArray: true,
          transformResponse: function (data) {
            // we strip the ids of the objects only
            var col, res, i;
            col = JSON.parse(data).$collection;
            res = [];
            for (i = 0; i < col.length; ++i) {
              res.push(col[i]);
            }
            return res;
          }
        }
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
          iccData.categories = [{ 'key': 'Indicators' }];
        } else {
          indicatorCategoryExists = false;
          iccData.categories.forEach(function (c) {
            if (c && c.key && c.key === 'Indicators') {
              indicatorCategoryExists = true;
            }
          });
          if (!indicatorCategoryExists) {
            iccData.categories.push({ 'key': 'Indicators' });
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
      convertToCorrectIccDataFormat: convertToCorrectIccDataFormat
    };
  }
]);