'use strict'

describe('The History Page', function() {

  beforeEach(module('PU'));
  var $rootScope;
  var $httpBackend;
  var $scope;
  var createController;
  var DB;
  var $routeParams;

  var testStus = [
        {
          user:{
            name: "Elliot Cheung",
            uid: "0",
          },
          role: "student"
        },
        {
          user:{
            name: "Kathryn Hansen",
            uid: "1",
          },
          role: "student"
        },
        {
          user:{            
            name: "Ryan Walter",
            uid: "2",
          },
          role: "student"
        },
        {
          user:{            
            name: "Iliya Svirsky",
            uid: "3",
          },
          role: "student"
        },
      ];

  beforeEach(inject(function($injector) {

    // mock out our dependencies
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    $scope = $rootScope.$new();
    $routeParams = $injector.get('$routeParams');
    DB = $injector.get('DB');
    var $controller = $injector.get('$controller');

    createController = function () {
      return $controller('HistoryController', {
        $scope: $scope
      });
    };
  }));

  it('should store generations in memory', function(){
    createController();
    expect($scope.generations).toBeDefined();
  })

  it('should have the current class', function(){
    $routeParams.class = "TestClass";
    createController();
    expect($scope.currClass).toBe("TestClass");
  })
  
  it('should pull generations from the back-end', function(){
    $routeParams.class = "test";
    var mockGens = [{classid: "test", title: "one", id: '1'}];
    var currUser = {name: "test"};
    $httpBackend.expectGET("/currentUser").respond(currUser);
    $httpBackend.expectGET("/test/generations").respond(mockGens);
    $httpBackend.expectGET("/test/pairs").respond([]);
    $httpBackend.expectGET("/test/members").respond([]);
    createController();
    $httpBackend.flush()
    expect($scope.generations[0]).toEqual(mockGens[0]);
  })



})