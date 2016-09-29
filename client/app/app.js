
angular.module('PU', [
  'ngRoute',
  'PU.signin',
  'PU.home',
  'PU.createPool',
  'ngAnimate',
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
      //TODO
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