angular.module('PU.history', ['PU.factories'])

.controller('HistoryController', function ($scope, $location, Makerpass, $http, $routeParams) {
  //$routeParams.class //name id of the class! 
  $scope.generationId = 1;
  $scope.pastPairs = []
  $scope.getHistory = function(classId, generationId){
    //database function to get all data
    console.log('database function called')
  }
  $scope.next = function(){

    $scope.generationId++
    $scope.getHistory($routeParams.class, $scope.generationId);
  }
  $scope.previous = function(){
    if($scope.generationId>=2){
    $scope.generationId--
    }
    $scope.getHistory($routeParams.class, $scope.generationId);
  }

  $scope.goHome = function(){
    $location.path('/');
  }


})