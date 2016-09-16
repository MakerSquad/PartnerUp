
angular.module('PU.main', ['PU.factories'])

.controller('MainController', function ($scope, $location, Makerpass, $http) {

  $http({
    method: "GET",
    url: "/currentUser"
  })
  .then(function(resp){
    console.log("Current User Data: ", resp);
    if(resp.data === ""){
      $location.path('/signin');
    } 
    else{
      $scope.currentUser = resp.data;
    }
  })

  $scope.currentUser = {}
  $scope.classes = []; //all classes the user is a part of
  $scope.students = []; //students in the current class
  $scope.instructors = []; //the current instructors
  $scope.fellows = []; //the current fellows
  $scope.currentClass; //the current class
  $scope.groups = [];//the current assigned groups
  $scope.noPair = []; //the current removed students
  $scope.groupSize = 2;
  $scope.loading = true;
  $scope.partnerUp = false;
  $scope.roles = ["instructor", "fellow", "student"];

  $scope.selectedForSwap = null;
  $scope.selectedForSwapIndex;


  $scope.creatingGroup = false;
  $scope.modalUserList = [];

  $scope.changeClass = function(cls){
    $scope.loading = true;
    console.log("Switching to: ", cls);
    $scope.currentClass = cls;


    //TODO: This should be a database call
    return Makerpass.getMemberships($scope.currentClass.name_id)
    .then(function(members){
      console.log("Members: ", members);
      $scope.students = members.data.filter(m => m.role === 'student');
      $scope.fellows = members.data.filter(m => m.role === 'fellow');
      $scope.instructors = members.data.filter(m => m.role === 'instructor');
      $scope.loading = false;
    })
  }

  /*
  * Takes a number and generates an array that contains indexes from 0 to that number
  * (Used to ng-repeat for a specific number)
  */
  $scope.getIndexArray = function(num){
    var arr = [];
    for(var i = 0; i < num; i++){
      arr[i] = i;
    }
    return arr;
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
     var index = $scope.students.indexOf(student);
     $scope.noPair.push($scope.students.splice(index, 1)[0]);
  }

  $scope.addStudentBackIn = function(nopair){
    var index = $scope.noPair.indexOf(nopair);
    $scope.students.push($scope.noPair.splice(index,1)[0]);
  }

  $scope.importFromMakerpass = function(){
    Makerpass.getGroups()
    .then(function(groups){
      $scope.classes = $scope.classes.concat(groups.data);
      $scope.loading = false;
    })
  }

  //Functions for rearranging students
  $scope.selectForSwap = function(student){
    var selectedIndex = searchForSelected(student);
    if($scope.selectedForSwap === student){
      $scope.selectedForSwap = null;
      $scope.selectedForSwapIndex = null;
    }else if($scope.selectedForSwap === null){
      $scope.selectedForSwap = student;
      $scope.selectedForSwapIndex = selectedIndex; 
    }else{
      swapStus(selectedIndex, $scope.selectedForSwapIndex);
      $scope.selectedForSwap = null;
      $scope.selectedForSwapIndex = null;
    }
  }

  var searchForSelected = function(student){
    for(var i = 0; i < $scope.groups.length; i++){
      for(var j = 0; j < $scope.groups[i].length; j++){
        if($scope.groups[i][j] === student){
          return [i, j];
        }
      }
    }
  }

  var swapStus = function(indexTuple1, indexTuple2){
    var tmp = $scope.groups[indexTuple1[0]][indexTuple1[1]];
    $scope.groups[indexTuple1[0]][indexTuple1[1]] = $scope.groups[indexTuple2[0]][indexTuple2[1]]
    $scope.groups[indexTuple2[0]][indexTuple2[1]] = tmp;
  }

  //Functions for the createGroup Modal below
  $scope.openCreateModal = function(){
    $scope.modalUserList = [];
    $scope.inputRole = "";
    $scope.inputName = "";
    $scope.groupName = "";
    $scope.creatingGroup = true;
  }

  $scope.closeCreateModal = function(){
    $scope.creatingGroup = false;
  }

  $scope.addToUserList = function(name, role){
    var newUser = {role: role, user: {name: name}} //matches MakerPass format
    $scope.modalUserList.push(newUser);
    $scope.inputName = "";
    return newUser;
  }

  $scope.createClass = function(name, users){
    console.log("Got name: ", name);
    console.log("Got users: ", users);
    $scope.loading = true;
    $scope.classes.push({name: name});
    $scope.students = users.filter(m => m.role === 'student');
    $scope.fellows = users.filter(m => m.role === 'fellow');
    $scope.instructors = users.filter(m => m.role === 'instructor');
    $scope.loading = false;
    $scope.closeCreateModal();
  }

})

