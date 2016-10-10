angular.module('PU.factories', [])

.factory('MakerPass', function($http) {
  var getCohorts = function() {
    return $http({
      method: "GET",
      url: '/cohorts'
    })
    .then(classes => classes.data)
    .catch(err => err);
  };

  var getMemberships = function(cls) {
    return $http({
      method: "GET",
      url: `/cohort/${cls.uid}`
    })
    .then(members => members.data)
    .catch(err => err);
  };

  return {
    getCohorts: getCohorts,
    getMemberships: getMemberships
  };
})

.factory('CurrentUser', function($http, $location) {
  var currentUser;

  var set = function(userInfo) {
    currentUser = userInfo;
  };

  var get = function() {
    if (document.cookie.includes("token")) {
      return $http({
        method: "GET",
        url: "/currentUser"
      })
      .then(userData => {
        return userData.data.user;
      })
      .catch(err => Promise.reject(err.statusText));
    } else {
      return Promise.reject("No signin info");
    }
  };

  var signOut = function() {
    currentUser = undefined;
    document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;'; // delete the token cookie
    return $http({
      method: 'GET',
      url: '/signout'
    }).then(function() {
      $location.path('/signin');
    })
    .catch(function(err) {
      console.error("Logout failed: ", err);
    });
  };

  return {
    set: set,
    get: get,
    signOut: signOut
  };
})

.factory('DB', function($http) {
  var getPool = function(poolId) {
    if (!Number.isInteger(Number(poolId))) {
      return Promise.reject("Invalid pool id");
    }
    return $http({
      method: 'GET',
      url: `/group/${poolId}`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var getClasses = function() {
    return $http({
      method: 'GET',
      url: '/groups'
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var getMemberships = function(cls) {
    return $http({
      method: 'GET',
      url: `/group/${cls.id}/members`
    })
    .then(resp => {
      return resp.data;
    })
    .catch(err => Promise.reject(err.statusText));
  };

  var getPairs = function(cls) {
    return $http({
      method: 'GET',
      url: `/group/${cls.id}/pairs`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var addPairs = function(cls, pairs, genTitle, groupSize) {
    return $http({
      method: 'POST',
      url: `/group/${cls.id}/pairs`,
      data: {
        pairs: pairs,
        genTitle: genTitle,
        groupSize: groupSize
      }
    })
    .then(resp => {
      return resp.data;
    })
    .catch(err => Promise.reject(err.statusText));
  };

  var getGroupings = function(cls) {
    return $http({
      method: 'GET',
      url: `/group/${cls.id}/generations`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var deleteGeneration = function(groupId, genId) {
    return $http({
      method: 'DELETE',
      url: `/${groupId}/generation/${genId}`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var deleteAllGenerations = function(groupId) {
    return $http({
      method: 'DELETE',
      url: `/${groupId}/deletePairs`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var getRecentPairs = function(cls) {
    return $http({
      method: 'GET',
      url: `/group/${cls.id}/recent`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var createClass = function(members, groupData) {
    return $http({
      method: 'POST',
      url: '/group',
      data: {members: members,
      groupData: groupData}
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var deletePool = function(groupId) {
    return $http({
      method: 'DELETE',
      url: `/group/${groupId}`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var deleteAGrouping = function(groupId, id) {
    return $http({
      method: 'DELETE',
      url: `/group/${groupId}/generation/${id}`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var getUserHistory = function(userUid) {
    return $http({
      method: 'GET',
      url: `/user/${userUid}`
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  var canCreate = function() {
    return $http({
      method: 'GET',
      url: '/canCreate'
    })
    .then(resp => resp.data)
    .catch(err => Promise.reject(err.statusText));
  };

  return {
    getUserHistory: getUserHistory,
    getClasses: getClasses,
    getMemberships: getMemberships,
    getPairs: getPairs,
    addPairs: addPairs,
    getGroupings: getGroupings,
    deleteGeneration: deleteGeneration,
    deleteAllGenerations: deleteAllGenerations,
    getRecentPairs: getRecentPairs,
    createClass: createClass,
    getPool: getPool,
    deletePool: deletePool,
    deleteAGrouping: deleteAGrouping,
    canCreate: canCreate
  };
});
