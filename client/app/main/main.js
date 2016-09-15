angular.module('PU.main', ['PU.factories'])

.controller('MainController', function ($scope, $location, Makerpass) {
  $scope.classes = []; //all classes the user is a part of
  $scope.students = []; //students in the current class
  $scope.instructors = []; //the current instructors
  $scope.fellows = []; //the current fellows
  $scope.currentClass; //the current class
  $scope.groups = [];//the current assigned groups
  $scope.loading = true;
  $scope.partnerUp = false;

  $scope.changeClass = function(cls){
    $scope.loading = true;
    console.log("Switching to: ", cls);
    $scope.currentClass = cls;

    return Makerpass.getMemberships($scope.currentClass.name_id)
    .then(function(members){
      console.log("Members: ", members);
      $scope.students = members.data.filter(m => m.role === 'student');
      $scope.fellows = members.data.filter(m => m.role === 'fellow');
      $scope.instructors = members.data.filter(m => m.role === 'instructor');
      $scope.loading = false;
    })
    //TODO: Get students for current class
  }

  $scope.randomize = function(groupSize){
    $scope.groups = [];
    var stus = $scope.students.slice();

    var shuffled = [];
    for(var i = 0; i < stus.length % groupSize; i++){
      stus.push({user:{name: "Code Monkey"}});
    }

    while(stus.length){
      var randInd = Math.floor(Math.random() * stus.length);
      shuffled.push(stus.splice(randInd, 1)[0]);
    }

    for(var i = 0; i < shuffled.length; i += groupSize){
      console.log("$scope groups in for loop: ", $scope.groups);
      $scope.groups.push(shuffled.slice(i, i+groupSize))
    }

    $scope.partnerUp = true;
    return $scope.groups;
  }

  $scope.removeFromStudent = function(student){
     var index = $scope.students.indexOf(student)
     $scope.students.splice(index, 1);
  }

  Makerpass.getGroups()
  .then(function(groups){
    console.log("My group data: ", groups);
    $scope.classes = groups.data;
    $scope.loading = false;
  })
});