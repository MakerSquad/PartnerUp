angular.module('PU.home', ['PU.factories'])

.controller('HomeController', function ($scope, MakerPass, $location, $route, $http, StateSaver, DB, CurrentUser) {
document.getElementById("bodyclass").className = "";
$scope.currentUser = {} //where we store the current user's information 
$scope.pools = []; //where  we store the total amout of pools from the owner

$scope.showPools = function(){
 return DB.getClasses()
  .then(function(data){
    console.log('i make its here', data)
    $scope.pools = data;
    console.log('lALALALALA',$scope.pools)
  })
  .catch(function(err){console.log('showPools err',err);})
}

$scope.goToCreatePool = function(){
  $location.path('/createPool')
}

 var init = (function(){ //function that runs on load; it'll call all the fns to set up the page
    
    new Clipboard('.clipyclip');
 
     CurrentUser.get()
     .then(function(userData){
      console.log("Userdata: ", userData);
        if(!userData){
          $location.path('/signin');
        } 
        else{
          $scope.currentUser = userData;
          var savedState = StateSaver.restoreState(); //if we previously saved state, grab it back
          if(savedState){
            $scope = Object.assign($scope, savedState); //copy the saved state back into scope
            if(savedState.edited){
              $route.reload()
            }
          }
          Promise.all([
            $scope.showPools()
          ])
          .then(function(resolveData){
            console.log("Promises resolved");
            console.log('resolveData', resolveData)
            // $scope.modalCohorts = resolveData[1];
            // $scope.initialized = true;
            console.log("Current scope: ", $scope);
            $scope.$apply();
          })
        }
     })
     .catch(function(err){
      $location.path('/signin');
      $scope.$apply();
     })
    //})
  }())


})