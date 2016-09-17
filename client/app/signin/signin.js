// do not tamper with this code in here, study it, but do not touch
// this Auth controller is responsible for our client side authentication
// in our signup/signin forms using the injected Auth service
angular.module('PU.signin', [

  ])

.controller('AuthController', function ($scope, $window, $location, $http) {
  $scope.user = {};

  $http({ //Check the current user
    method: "GET",
    url: "/currentUser"
  })
  .then(function(resp){
    if(resp.data !== ""){
      $location.path('/');
    }
  })

  $scope.loginMakerPass = function(){
    $window.location.href = '/auth/makerpass';
  }
});
