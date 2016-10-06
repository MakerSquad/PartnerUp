angular.module('PU', [
  'ngRoute',
  'PU.signin',
  'PU.home',
  'PU.createPool',
  'ngAnimate',
  'PU.poolPage',
  'PU.userHistory',
  'PU.demoHome',
  'PU.demoPoolPage',
  'PU.demoUserHistory',
  'PU.demoCreatePool',
  'PU.demoStart'
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
  .when('/users/:userUid', {
    templateUrl: 'userHistory/userHistory.html',
    controller: 'UserHistoryController'
  })
  .when('/demo/', {
    templateUrl: 'demo/demoStart/demoStart.html',
    controller: 'DemoStartController'
  })
  .when('/demo/home', {
    templateUrl: 'demo/demoHome/demoHome.html',
    controller: 'DemoHomeController'
  })
  .when('/demo/pools/:poolId', {
    templateUrl: 'demo/demoPoolPage/demoPoolPage.html',
    controller: 'DemoPoolPageController'
  })
  .when('/demo/users/:userUid', {
    templateUrl: 'demo/demoUserHistory/demoUserHistory.html',
    controller: 'DemoUserHistoryController'
  })
  .when('/demo/createPool', {
    templateUrl: 'demo/demoCreatePool/demoCreatePool.html',
    controller: 'DemoCreatePoolController'
  })
  .otherwise({
    redirectTo: '/'
  });
})

.directive('loading', function() {
  return {
    templateUrl: 'directives/loading.html'
  };
})

.directive('header', function() {
  var controller = function($scope, $location, $http, CurrentUser) {
    var path = $location.path();
    $scope.nicknames = {
      'a4fa408de847': 'Patty Cakes',
      '90b72025841d': 'Gilby',
      "ab2bc0473a48": 'Kitty',
      "8534c57b54f4": 'Waltisha',
      "bfc5a48d77ae": 'Russian Man',
      '2a97b80a545a': 'Jam Jam',
      '3a9137d82c2b': 'Ez'
    };

    $scope.hideMyPools = path === '/'; // NB: these routes might change
    $scope.hideCreatePool = path === '/createPool';
    $scope.currentUser;

    var init = (function()
     {
      CurrentUser.get()
      .then(function(user) {
        if(!user) {
          $location.path('/signin');
        } else {
          $scope.currentUser = user;
          $scope.hideHist = path === `/users/${user.uid}`;
          console.log("In header, currentUser: ", $scope.currentUser);
        }
      });
    }());

    $scope.seeMyPools = function() {
      $location.path('/');
    };

    $scope.goToCreatePool = function() {
      $location.path('/createPool');
    };

    $scope.signOut = function() {
      CurrentUser.signOut();
    };

    $scope.goToMyHistory = function() {
      $location.path(`/users/${$scope.currentUser.uid}`);
    };
  };

  return {
    controller: controller,
    templateUrl: 'directives/header.html'
  };
})

.directive('demoheader', function() {
  var controller = function($scope, $location, $http, CurrentUser) {
    var path = $location.path();
    $scope.hideMyPools = path === '/demo/home'; // NB: these routes might change
    $scope.hideCreatePool = path === '/demo/createPool';
    $scope.currentUser;
    var init = (function() {
        $scope.currentUser = window.currentUser;
        $scope.hideHist = path === `/demo/users/${currentUser.uid}`;
      }())

    $scope.seeMyPools = function() {
      $location.path('/demo/home');
    };

    $scope.goToCreatePool = function() {
      $location.path('/demo/createPool');
    };

    $scope.signOut = function() {
      CurrentUser.signOut();
    };

    $scope.goToMyHistory = function() {
      $location.path(`/demo/users/${$scope.currentUser.uid}`);
    };
  }

  return {
    controller: controller,
    templateUrl: 'directives/header.html'
  }
})
// .run();
