angular.module('PU.factories', [])

.factory('Makerpass',function($http){
  
  var getGroups = function(){
    return $http({
      method: 'GET',
      url: '/myGroups'
    })
  }

  var getMemberships = function(cls){
    return $http({
      method: 'GET',
      url: `/groups/${cls}/memberships`,
    })
  }

  return {
    getGroups: getGroups,
    getMemberships: getMemberships
  }  

})

.factory('StateSaver', function(){
  var state = null; //set to null if nothing is saved

  var saveState = function(toSave){
    console.log('Saving: ', toSave);
    state = toSave;
  }

  var restoreState = function(){
    var tmp = state;
    state = null; //clear out the state
    console.log("Restoring: ", tmp);
    return tmp;
  }

  return {
    saveState: saveState,
    restoreState: restoreState
  }

})
