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
      url: `http://api.makerpass.com/groups/${cls}/memberships`,
      headers: {
        Authorization: 'bearer e3821f8bec3881a95013794a71994d17cf306c05c8453c716c00507df3d5393f'
      }
    })
  }

  return {
    getGroups: getGroups,
    getMemberships: getMemberships
  }  
})




