'use strict'

describe('The Home Page', function() {

  beforeEach(module('PU'));
  var $rootScope;
  var $httpBackend;
  var $scope;
  var createController;
  var DB;
  var $routeParams;
  var StateSaver;

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
    StateSaver = $injector.get('StateSaver');
    DB = $injector.get('DB');
    var $controller = $injector.get('$controller');

    createController = function () {
      return $controller('HomeController', {
        $scope: $scope
      });
    };
  }));

   it('should have a $scope.pools', function(){
    createController();
    expect($scope.pools).toBeDefined();
  })

  // it('should have the current class', function(){
  //   createController();
  //   $scope.pools = testPools;
  //   expect($scope.pools).toBe(testPools);
  // })
  //fake backend
  it('should pull generations from the back-end', function(){
    
   
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
    $httpBackend.expectGET("/currentUser").respond(currUser);
    $httpBackend.expectGET("/groups").respond(mockPools);
    // $httpBackend.expectDELETE( `/group/${groupId}`);
    createController();
    $httpBackend.flush();
    // expect($scope.pools[0]).toEqual(mockPools[0]);
  })



})
