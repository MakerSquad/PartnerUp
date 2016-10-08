'use strict'

describe('The Create Pools Page', function() {

  beforeEach(module('PU'));
  var $rootScope;
  var $httpBackend;
  var $scope;
  var createController;
  var DB;
  var $routeParams;

  var $location;
  var $q;
  var deferred;

  beforeEach(inject(function($injector) {

    // mock out our dependencies
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    $scope = $rootScope.$new();
    $routeParams = $injector.get('$routeParams');

    DB = $injector.get('DB');
    $location = $injector.get('$location');
    $q = $injector.get('$q');
    deferred = $q.defer();
    var $controller = $injector.get('$controller');
    

    createController = function () {
      return $controller('CreatePoolController', {
        $scope: $scope,
        $location: $location,

      });
    };
  }));

   it('should have a $scope.allCohorts', function(){
    createController();
    expect($scope.allCohorts).toBeDefined();
  });

   it('showPools should be a function', function(){
    createController();
    expect($scope.importStudents).toBeDefined();
   });

  it('should have a return to home feature', function () {
    createController();
    expect($scope.goHome).toBeDefined();
  });

  it('should have a working groupSize feature', function() {
    createController();
    expect($scope.getIndexArray(9)).toEqual([0,1,2,3,4,5,6,7,8])
  });

  it('should change location when clicking createPool button', inject(function() {   
    createController(); 
    spyOn($location, 'path');    
    $scope.goHome();
    expect($location.path).toHaveBeenCalledWith('/');
  }));

  it('should have a create pools feature', function () {
    createController();
    expect($scope.createPool).toBeDefined();
  });

  it('should toggle admins', function() {
    var user = { user_uid: 1234 };
    var user2 = { user_uid: 2345};
    createController();
    $scope.currentUser = { uid: 2345};
    $scope.toggleAdmin(user);
    expect($scope.isAdmin[user.user_uid]).toEqual(true);
    $scope.toggleAdmin(user);
    expect($scope.isAdmin[user.user_uid]).toEqual(undefined);
    expect($scope.toggleAdmin(user2)).toEqual("You must be an admin of your own group");
  });

  it('should toggle admins', function() {
    var user = { user_uid: 1234 };
    createController();
    $scope.toggleStu(user);
    expect($scope.isStudent[user.user_uid]).toEqual(true);
    $scope.toggleStu(user);
    expect($scope.isStudent[user.user_uid]).toEqual(undefined);
  });
  // xit('should change location when creating a pool', inject(function() {   
  //   createController(); 
  //   spyOn($location, 'path');    
  //       $scope.poolName = "test"
  //       $scope.users = [{userId: 1, role: 'student'}, {userId: 2, role: 'student'}]
        
  //       $scope.createPool().then();
  //       resp = 1
  //       expect($location.path).toHaveBeenCalled('/pools/1');
  //   }));
})

// it('goToPool', function () {
//     createController();
//   expect($scope.goToPool).toBeDefined();
// });

// it('showsPools should resolve a promise', function(done){
//   // spyOn(DB, 'getClasses').and.returnValue(deferred.promise);
//   var mockPools = [{
//         id: 1,
//         name:"abc",
//         role: "student",
//         size:2
//         },
//         {
//          id: 2,
//         name:"234",
//         role: "memberAdmin",
//         size:4
//         },
//         {
//          id: 3,
//         name:"def",
//         role: "fellow",
//         size:3
//         },
//         {
//         id: 4,
//         name:"!@#$",
//         role: "instructor",
//         size:5
//         }];
//         var currUser = {name: "test"};
//             $httpBackend.expectGET("home/home.html").respond([]);
//     $httpBackend.expectGET("/currentUser").respond(currUser);
//     // $httpBackend.expectDELETE( `/group/${groupId}`);
//     $httpBackend.expectGET("/groups").respond(mockPools);
//   // deferred.resolve(mockPools);
//   createController();
//   $scope.$apply();
//   expect($scope.pools).not.toBe(undefined);
//   expect($scope.pools).toEqual(mockPools);
//   done();
// })
