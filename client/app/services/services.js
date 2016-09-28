angular.module('PU.factories', [])

.factory('MakerPass', function($http){
  var getCohorts = function(){
    return $http({
      method: "GET",
      url: '/cohorts'
    })
    .then((classes) => classes.data)
    .catch((err) => err);
  }

  var getMemberships = function(cls){
    return $http({
      method: "GET",
      url: `/${cls.mks_id}/members`,
    })
    .then((members) => members.data)
    .catch((err) => err)
  }

  return {
    getCohorts: getCohorts,
    getMemberships: getMemberships
  }
})

.factory('CurrentUser', function($http){
  var currentUser;

  var set = function(userInfo){
    currentUser = userInfo;
  }

  var get = function(){
    if(document.cookie.includes("token")){
      return $http({
        method: "GET",
        url: "/currentUser"
      })
      .then((userData) => {
        return userData.data.user;
      })
    }else{
      console.log("No signin info");
      return Promise.reject("No signin info");
    }
    //return currentUser;
  }

  var destroy = function(){
    currentUser = undefined;
  }

  return {
    set: set,
    get: get,
    destroy: destroy
  }
})

.factory('StateSaver', function(){
  var state = null; //set to null if nothing is saved

  var saveState = function(toSave){
    console.log('Saving: ', toSave);
    state = toSave;
  }
  var checkState = function(){
    return state
  }

  var restoreState = function(){
    var tmp = state;
    state = null; //clear out the state
    console.log("Restoring: ", tmp);
    return tmp;
  }

  var updateState = function(newState){
    state = Object.assign(state, newState);
  }

  return {
    saveState: saveState,
    restoreState: restoreState,
    checkState: checkState,
    updateState: updateState
  }

})

.factory('DB', function($http){

  var getClasses = function(){
    return $http({
      method: 'GET',
      url: '/groups'
    })
    .then(resp => resp.data)
    .catch(err => err);
  }

  var getMemberships = function(cls){
    return $http({
      method: 'GET',
      url: `/group/${cls.groupId}/members`,
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var getPairs = function(cls){
    return $http({
      method: 'GET',
      url: `/group/${cls.groupId}/pairs`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var addPairs = function(cls, pairs, genTitle, groupSize){
    return $http({
      method: 'POST',
      url: `/group/${cls.groupId}/pairs`,
      data: {
        pairs: pairs,
        genTitle: genTitle,
        groupSize: groupSize
      }
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var getGenerations = function(cls){
    return $http({
      method: 'GET',
      url:`/group/${cls.groupId}/generations`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var deleteGeneration = function(groupId, genId){
    return $http({
      method: 'DELETE',
      url: `/${groupId}/generation/${genId}`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var deleteAllGenerations = function(groupId){
    return $http({
      method: 'DELETE',
      url: `/${groupId}/deletePairs`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var getRecentPairs = function(cls){
    return $http({
      method: 'GET',
      url: `/group/${cls.groupId}/recent`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var createClass = function(){
    //TODO: make this do something
  }

  return{
    getClasses: getClasses,
    getMemberships: getMemberships,
    getPairs: getPairs,
    addPairs: addPairs,
    getGenerations: getGenerations,
    deleteGeneration: deleteGeneration,
    deleteAllGenerations: deleteAllGenerations,
    getRecentPairs: getRecentPairs,
    createClass: createClass
  }
  
})
