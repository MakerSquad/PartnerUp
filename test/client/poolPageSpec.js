'use strict';

describe('On the Pool Page,', function() {
  beforeEach(module('PU'));

  var $rootScope;
  var $httpBackend;
  var $scope;
  var createController;
  var $routeParams;
  var MakerPass;
  var $location;
  var $route;
  var $http;
  var DB;
  var CurrentUser;

  var testPools = [
    {name: "Class 1", id: 1, role: "student", size: 2},
    {name: "Joe's Group", id: 2, role: "instructor", size: 3}
  ];

  var testStus = [
    {
      user: {
        name: "Elliot Cheung",
        uid: "0"
      },
      role: "student"
    },
    {
      user: {
        name: "Kathryn Hansen",
        uid: "1"
      },
      role: "student"
    },
    {
      user: {
        name: "Ryan Walter",
        uid: "2"
      },
      role: "student"
    },
    {
      user: {
        name: "Iliya Svirsky",
        uid: "3"
      },
      role: "student"
    },
    {
      user: {
        name: "Gilbert Garza",
        uid: '4'
      },
      role: 'instructor'
    },
    {
      user: {
        name: "Jimmy Stevenson",
        uid: '5'
      },
      role: 'fellow'
    }
  ];

  beforeEach(inject(function($injector) {
    // mock out our dependencies
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $routeParams = $injector.get('$routeParams');
    MakerPass = $injector.get('MakerPass');
    $location = $injector.get('$location');
    //  $route = $injector.get('$route');
    $http = $injector.get('$http');
    DB = $injector.get('DB');
    CurrentUser = $injector.get('CurrentUser');

    var $controller = $injector.get('$controller');

    createController = function() {
      return $controller('PoolPageController', {
        $scope: $scope,
        CurrentUser: CurrentUser,
        DB: DB,
        MakerPass: MakerPass
      });
    };
  }));

  describe('The current pool\'s info', function() {
    it('should be stored on scope', function() {
      createController();
      expect($scope.currPool).toBeDefined();
    });
  });

  describe('$scope.students', function() {
    it('should be defined', function() {
      createController();
      expect($scope.students).toBeDefined();
    });
  });

  describe('$scope.randomize', function() {
    it('should be defined', function() {
      createController();
      expect($scope.randomize).toBeDefined();
    });

    it('should not mutate $scope.students', function() {
      createController();
      $scope.students = testStus;
      $scope.randomize();
      expect($scope.students).toEqual(testStus);
    });

    it('should push the current students into $scope.groups', function() {
      createController();
      $scope.students = testStus.slice(0, 4);
      $scope.randomize();
      expect($scope.students).toContain($scope.groups[0][0]);
    });

    it('should call trueRandomize if unable to make groups', function() {
      createController();
      spyOn($scope, "trueRandomize");
      $scope.students = testStus.slice(0, 2);
      $scope.pastPairs = {'0': {'1': true}, '1': {'0': true}};
      $scope.randomize();
      expect($scope.trueRandomize).toHaveBeenCalled();
    });
  });

  describe('$scope.startNewGrouping', function() {
    it('should show or hide the new grouping controls', function() {
      createController();
      $scope.creatingNewGrouping = false;
      $scope.startNewGrouping();
      expect($scope.creatingGrouping).toBe(true);
      $scope.startNewGrouping();
      expect($scope.creatingGrouping).toBe(false);
    });
    it('should call $scope.randomize when showing the controls', function() {
      createController();
      spyOn($scope, "randomize");
      $scope.creatingGrouping = false;
      $scope.startNewGrouping();
      expect($scope.randomize).toHaveBeenCalled();
    });
    it('should not call $scope.randomize when hiding the controls', function() {
      createController();
      spyOn($scope, "randomize");
      $scope.creatingGrouping = true;
      $scope.startNewGrouping();
      expect($scope.randomize).not.toHaveBeenCalled();
    });
  });

  describe('$scope.makeMap', function() {
    it('should generate a mapping between $scope.students and their ids', function() {
      createController();
      $scope.students = testStus.slice(0, 3);
      $scope.makeMap();
      expect($scope.idMap['0']).toEqual(testStus[0]);
    });
    it('should not mutate $scope.students', function() {
      createController();
      $scope.students = testStus;
      $scope.makeMap();
      expect($scope.students).toEqual(testStus);
    });
  });

  describe('$scope.selectForSwap', function() {
    it('should set the selected student, and their index', function() {
      createController();
      $scope.selectedForSwap = null;
      $scope.students = testStus.slice(0, 4);
      $scope.groups = [$scope.students.slice(0, 2), $scope.students.slice(2)];
      $scope.selectForSwap($scope.students[0]);
      expect($scope.selectedForSwap).toBe($scope.students[0]);
      expect($scope.selectedForSwapIndex).toEqual([0, 0]);
    });
    it('should deselect the student if they are already selected', function() {
      createController();
      $scope.selectedForSwap = null;
      $scope.students = testStus.slice(0, 4);
      $scope.groups = [$scope.students.slice(0, 2), $scope.students.slice(2)];
      $scope.selectForSwap($scope.students[0]);
      $scope.selectForSwap($scope.students[0]);
      expect($scope.selectedForSwap).toBeFalsy();
      expect($scope.selectedForSwapIndex).toBeFalsy();
    });
    it('should swap the indexes of two students', function() {
      createController();
      $scope.selectedForSwap = null;
      $scope.students = testStus.slice(0, 4);
      $scope.groups = [$scope.students.slice(0, 2), $scope.students.slice(2)];
      $scope.selectForSwap($scope.students[0]);
      $scope.selectForSwap($scope.students[1]);
      expect($scope.groups[0][0]).toBe($scope.students[1]);
      expect($scope.groups[0][1]).toBe($scope.students[0]);
      expect($scope.selectedForSwapIndex).toBeFalsy();
      expect($scope.selectedForSwap).toBeFalsy();
    });
    it('should be able to swap between groups', function() {
      createController();
      $scope.selectedForSwap = null;
      $scope.students = testStus.slice(0, 4);
      $scope.groups = [$scope.students.slice(0, 2), $scope.students.slice(2)];
      $scope.selectForSwap($scope.students[0]);
      $scope.selectForSwap($scope.students[2]);
      expect($scope.groups[0][0]).toBe($scope.students[2]);
      expect($scope.groups[1][0]).toBe($scope.students[0]);
    });
  });
  describe('$scope.toggleLockStu', function() {
    it('should mark a student as locked, and save their index', function() {
      createController();
      $scope.students = testStus.slice(0, 4);
      $scope.groups = [$scope.students.slice(0, 2), $scope.students.slice(2)];
      $scope.toggleLockStu($scope.students[0]);
      expect($scope.lockedStus[$scope.students[0].user.uid]).toEqual([0, 0]);
    });
    it('should keep the students in place during calls to randomize', function() {
      createController();
      $scope.students = testStus.slice(0, 4);
      $scope.makeMap();
      $scope.groups = [$scope.students.slice(0, 2), $scope.students.slice(2)];
      $scope.toggleLockStu($scope.students[0]);
      $scope.randomize();
      expect($scope.groups[0][0]).toBe($scope.students[0]);
      $scope.randomize();
      expect($scope.groups[0][0]).toBe($scope.students[0]);
      $scope.randomize();
      expect($scope.groups[0][0]).toBe($scope.students[0]);
    });
    it('should unlock the student if they are already locked', function() {
      createController();
      $scope.students = testStus.slice(0, 4);
      $scope.groups = [$scope.students.slice(0, 2), $scope.students.slice(2)];
      $scope.toggleLockStu($scope.students[0]);
      $scope.toggleLockStu($scope.students[0]);
      expect($scope.lockedStus[$scope.students[0].user.uid]).toBeUndefined();
    });
  });
});
