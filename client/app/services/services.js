angular.module('PU.factories', [])

.factory('CurrentUser', function(){
  var currentUser;

  var set = function(userInfo){
    currentUser = userInfo;
  }

  var get = function(){
    return currentUser;
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

  return {
    saveState: saveState,
    restoreState: restoreState,
    checkState: checkState
  }

})

.factory('DB', function($http){

  var getClasses = function(){
    return $http({
      method: 'GET',
      url: '/myGroups'
    })
    .then(resp => resp.data)
    .catch(err => err);
  }

  var getMemberships = function(cls){
    return $http({
      method: 'GET',
      url: `/${cls}/members`,
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var getPairs = function(cls){
    return $http({
      method: 'GET',
      url: `/${cls}/pairs`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var addPairs = function(cls, pairs, genTitle, groupSize){
    return $http({
      method: 'POST',
      url: `/${cls}/pairs`,
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
      url:`/${cls}/generations`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var deleteGenerations = function(groupId, genId){
    return $http({
      method: 'DELETE',
      url: `/${groupId}/generations/${genId}`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }

  var deleteAllGenerations = function(groudId){
    return $http({
      method: 'DELETE',
      url: `/${groupId}/pairs`
    })
    .then(resp => resp.data)
    .catch(err => err)
  }
  return{
    getClasses: getClasses,
    getMemberships: getMemberships,
    getPairs: getPairs,
    addPairs: addPairs,
    getGenerations: getGenerations
  }
  
})
