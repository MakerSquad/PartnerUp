angular.module('PU', [
  'ngRoute',
  'PU.signin'
  ])
.config(function($routeProvider, $httpProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'signin/signin.html',
    controller: 'AuthController'
  })
})

// .run();