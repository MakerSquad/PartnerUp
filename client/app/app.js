angular.module('PU', [
  'PU.services',
  'PU.main',
  'PU.auth',
  'ngRoute'
])
.config(function($routeProvider, $httpProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'app/auth/signin.html',
      controller: 'AuthController'
    })

    .when('/loggingin', {
      templateUrl: 'app/auth/loadingPage.html',
      controller: 'loadingPageController'
    })
    
    .when('/main', {
      templateUrl: 'app/main/main.html',
      controller: 'MainController'
    })
});

