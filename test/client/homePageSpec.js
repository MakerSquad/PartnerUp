'use strict'

describe('The Home Page', function() {

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

  var testPools = [
        {
        id: 1,
        name:"abc",
        role: "student",
        size:2
        },
        {
         id: 2,
        name:"234",
        role: "memberAdmin",
        size:4
        },
        {
         id: 3,
        name:"def",
        role: "fellow",
        size:3
        },
        {
        id: 4,
        name:"!@#$",
        role: "instructor",
        size:5
        },
      ];

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
    // spyOn($location, 'path').and.returnValue('/');
    var $controller = $injector.get('$controller');
    

    createController = function () {
      return $controller('HomeController', {
        $scope: $scope,
        $location: $location,
        // getClasses: getClasses
      });
    };
  }));

   it('should have a $scope.pools', function(){
    createController();
    expect($scope.pools).toBeDefined();
  })
   it('showPools should be a function', function(){
    createController();
    expect($scope.showPools).toBeDefined();
   })

   it('should return a promise', function () {
    createController();
  expect($scope.showPools().then).toBeDefined();
});
  it('goToCreatePool', function () {
  createController();
  expect($scope.goToCreatePool).toBeDefined();
        //   spyOn($location, 'path');    
        // expect($location.path).toHaveBeenCalledWith('/createPool');
  // expect($scope.goToCreatePool()).toBe($location.path('/createPool'));
});
  it('should change location when clicking createPool button', inject(function() {   
    createController(); 
        spyOn($location, 'path');    
        $scope.goToCreatePool();
        expect($location.path).toHaveBeenCalledWith('/createPool');
    }));
    it('should change location when clicking a pools title', inject(function() {   
    createController(); 
        spyOn($location, 'path');    
        var pool = { id: 1}
        $scope.goToPool(pool);
        expect($location.path).toHaveBeenCalledWith('/pools/1');
    }));

it('goToPool', function () {
    createController();
  expect($scope.goToPool).toBeDefined();
});

it('showsPools should resolve a promise', function(done){
  // spyOn(DB, 'getClasses').and.returnValue(deferred.promise);
  var mockPools = [{
        id: 1,
        name:"abc",
        role: "student",
        size:2
        },
        {
         id: 2,
        name:"234",
        role: "memberAdmin",
        size:4
        },
        {
         id: 3,
        name:"def",
        role: "fellow",
        size:3
        },
        {
        id: 4,
        name:"!@#$",
        role: "instructor",
        size:5
        }];
        var currUser = {name: "test"};
            $httpBackend.expectGET("home/home.html").respond([]);
    $httpBackend.expectGET("/currentUser").respond(currUser);
    // $httpBackend.expectDELETE( `/group/${groupId}`);
    $httpBackend.expectGET("/groups").respond(mockPools);
  // deferred.resolve(mockPools);
  createController();
  $scope.$apply();
  expect($scope.pools).not.toBe(undefined);
  // expect($scope.pools).toEqual(mockPools);
  done();
})

//   it('should resolve with mockPools', function () {
//      var mockPools = [{
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
//     var currUser = {name: "test"};
//     // $httpBackend.expectGET("home/home.html").respond([]);
//     // $httpBackend.expectGET("/currentUser").respond(currUser);
//     // $httpBackend.expectDELETE( `/group/${groupId}`);
//     // $httpBackend.expectGET("/groups").respond(mockPools);
//     createController();
//     // $httpBackend.flush();

//   var data;

//   // set up a deferred
//   var deferred = $q.defer();
//   // get promise reference
//   var promise = deferred.promise;

//   // set up promise resolve callback
//   promise.then(function (response) {
//     data = response.success;
//   });

//   $scope.showPools().then(function(response) {
//     // resolve our deferred with the response when it returns
//     deferred.resolve(response);
//   });

//   // force `$digest` to resolve/reject deferreds
//   $rootScope.$digest();

//   // make your actual test
//   expect(data).toEqual(mockPools);
// });

//   // it('should have the current class', function(){
//   //   createController();
//   //   $scope.pools = testPools;
//   //   expect($scope.pools).toBe(testPools);
//   // })
//   //fake backend
//   it('should shows pools in reverse order', function(){
    
   
//     var mockPools = [{
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
//     var currUser = {name: "test"};
//     $httpBackend.expectGET("home/home.html").respond([]);
//     $httpBackend.expectGET("/currentUser").respond(currUser);
//     $httpBackend.expectGET("/groups").respond(mockPools);
//     // $httpBackend.expectDELETE( `/group/${groupId}`);
//     createController();
//     $httpBackend.flush();
// expect($scope.showPools()).toEqual(mockPools);
//     expect($scope.pools[0]).toEqual(mockPools[3]);
//   })



})
