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
.factory('APICalls',function($http){
  var loginMakerPass = function(){
    }
  return {
  }
})