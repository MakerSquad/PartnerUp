
angular.module('PU', [
  'ngRoute',
  'PU.signin',
  'PU.main',
  'PU.history',
  'ngAnimate',
  ])
.config(function($routeProvider, $httpProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'main/main.html',
    controller: 'MainController'
  })
  .when('/signin', {
    templateUrl: 'signin/signin.html',
    controller: 'AuthController'
  })
  .when('/:class/history', {
    templateUrl: 'history/history.html',
    controller: 'HistoryController'
  })
})

.directive('loading', function(){
  return{
    templateUrl: 'loading.html'
  }
})

// .run();