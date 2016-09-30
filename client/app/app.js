
angular.module('PU', [
  'ngRoute',
  'PU.signin',
  'PU.home',
  'PU.createPool',
  'ngAnimate',
  'PU.poolPage'
  ])
.config(function($routeProvider, $httpProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'home/home.html',
    controller: 'HomeController'
  })
  .when('/signin', {
    templateUrl: 'signin/signin.html',
    controller: 'AuthController'
  })
  .when('/createPool', {
    templateUrl: 'createPool/createPool.html',
    controller: 'CreatePoolController'
  })
  .when('/pools/:poolId', {
    templateUrl: 'poolPage/poolPage.html',
    controller: 'PoolPageController'
  })
})

.directive('loading', function(){
  return{
    templateUrl: 'directives/loading.html'
  }
})

.directive('header', function(){
  var controller = function($scope, $location, $http, CurrentUser){
    var path = $location.path();
    $scope.nicknames = {
      'a4fa408de847' : 'Patty Cakes',
      '90b72025841d': 'Gilby',
      "ab2bc0473a48": 'Kitty',
      "8534c57b54f4": 'Waltisha',
      "bfc5a48d77ae": 'Russian Man',
      '2a97b80a545a': 'Jam Jam',
      '3a9137d82c2b': 'Ez'
    }

    $scope.hideMyPools = path === '/'; //NB: these routes might change
    $scope.hideCreatePool = path === '/createPool';
    $scope.currentUser;

    var init = (function(){
      CurrentUser.get()
      .then(function(user){
        if(!user){
          $location.path('/signin');
        }else{
          $scope.currentUser = user;
          console.log("In header, currentUser: ", $scope.currentUser);
        }
      })
    }())

    $scope.seeMyPools = function(){
      $location.path('/');
    }

    $scope.goToCreatePool = function(){
      $location.path('/createPool');
    }

    $scope.signOut = function(){
      CurrentUser.signOut();
    }
  }

  return {
    controller: controller,
    templateUrl: 'directives/header.html'
  }
})

// .run();