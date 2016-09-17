
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

  $scope.pastPairs = {};
  $scope.finalized = true;
  $scope.clashes = [];
  var timeoutCounter = 0;
  var timeoutThreshold = 2500; //number of iterations to run before we assume we're in an infinite loop

  $scope.lockedGroups = [];
  var lockedStus = {};

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

  //THIS VERSION OF RANDOMIZE ROLLS THE WHOLE GROUP RANDOMLY
  $scope.trueRandomize = function(groupSize){
    console.log("Rolling");
    $scope.groups = [];
    var stus = $scope.students.filter(function(stu){
      return !lockedStus[stu.user.uid]; //don't shuffle the locked students
    })

    var shuffled = [];
    for(var i = 0; i < stus.length % groupSize; i++){
      stus.push({user:{name: "Code Monkey"}});
    }

    while(stus.length){
      var randInd = Math.floor(Math.random() * stus.length);
      shuffled.push(stus.splice(randInd, 1)[0]);
    }

    var clashIndexes = [];
    var tempGroups = [];
    var strandedIndexes = [];
    for(var i = 0; i < shuffled.length; i += groupSize){
      var group = shuffled.slice(i, i+groupSize);
      $scope.groups.push(group);
    }
    for(var i = 0; i < $scope.lockedGroups.length; i++){
      $scope.groups.splice($scope.lockedGroups[i][1], 0, $scope.lockedGroups[i][0])
    }
    checkClashes();
    $scope.partnerUp = true;
    $scope.finalized = false;
    return $scope.groups;
  }

  $scope.randomize = function(groupSize){
    timeoutCounter += 1;

    if(timeoutCounter > timeoutThreshold){
      alert(`Uh oh! We were unable to generate a list without repeating pairs; this is likely because ` +
      `most of the possible pairs, if not all of them, have already occurred. Here's a random list anyway. Sorry!`);
      timeoutCounter = 0;
      return $scope.trueRandomize(groupSize);
    }
    $scope.groups = [];
    var stus = $scope.students.filter(function(stu){
      return !lockedStus[stu.user.uid]; //don't shuffle the locked students
    })

    var shuffled = [];
    for(var i = 0; i < stus.length % groupSize; i++){
      stus.push({user:{name: "Code Monkey", uid: "-1"}});
    }

    while(stus.length){
      var randInd = Math.floor(Math.random() * stus.length);
      shuffled.push(stus.splice(randInd, 1)[0]);
    }

    while(shuffled.length){
      for(var j = 1; j < shuffled.length; j++){
        var failed = true;
        var first = shuffled[0];
        var group = [first];
        var noClashes = true;
        for(var k = 0; k < group.length; k++){
          if($scope.pastPairs[group[k].user.uid]){
            if($scope.pastPairs[group[k].user.uid][shuffled[j].user.uid]){
              noClashes = false;
              break;
            }
          }
        }
        if(noClashes){
          group.push(shuffled[j]);
          shuffled.splice(j, 1);
        }else{
          continue;
        }
        if(group.length === groupSize){
          $scope.groups.push(group);
          shuffled.splice(0, 1);
          failed = false;
          break;
        }
      }
      if(failed){
        return $scope.randomize(groupSize);
      }
    }
    for(var i = 0; i < $scope.lockedGroups.length; i++){
      $scope.groups.splice($scope.lockedGroups[i][1], 0, $scope.lockedGroups[i][0])
    }
    $scope.partnerUp = true;
    $scope.finalized = false;
    checkClashes();
    timeoutCounter = 0;
    return $scope.groups;
  }

  var checkClashes = function(){
    $scope.clashes = [];
    for(var i = 0; i < $scope.groups.length; i++){
      var group = $scope.groups[i];
      for(var j = 0; j < group.length; j++){
        var pushed = false;
        for(var k = j; k < group.length; k++){
          if($scope.pastPairs[group[j].user.uid]){            
            if($scope.pastPairs[group[j].user.uid][group[k].user.uid]){
              $scope.clashes.push(group);
              pushed = true;
              break;
            }
          }
        }
        if(pushed){
          break;
        }
      }
    }
  }

  /*
  * Finalize takes the current pairings and records them into the "past pairs" object
  */

  $scope.finalize = function(){
    for(var i = 0; i < $scope.groups.length; i++){
      for(var j = 0; j < $scope.groups[i].length; j++){
        for(var k = j+1; k < $scope.groups[i].length; k++){
          if(!$scope.pastPairs[$scope.groups[i][j].user.uid]){
            $scope.pastPairs[$scope.groups[i][j].user.uid] = {};
          }
          $scope.pastPairs[$scope.groups[i][j].user.uid][$scope.groups[i][k].user.uid] = true;
          if(!$scope.pastPairs[$scope.groups[i][k].user.uid]){
            $scope.pastPairs[$scope.groups[i][k].user.uid] = {};
          }
          $scope.pastPairs[$scope.groups[i][k].user.uid][$scope.groups[i][j].user.uid] = true; 
        }
      }
    }
    console.log("Past pairs: ", $scope.pastPairs);
    $scope.finalized = true;
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
    if(lockedStus[student.user.uid]){
      alert("This student has been locked into a group; please unlock them before moving them around");
      return;
    }
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
      if($scope.finalized){
        alert("Note: the groups have already been finalized; any manual edits will not be recorded")
      }
    }
    checkClashes();
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

  $scope.toggleLockGroup = function(group){
    for(var i = 0; i < $scope.lockedGroups.length; i++){
      if($scope.lockedGroups[i][0] === group){ //found the group in the locked groups
        var unlocked = $scope.lockedGroups.splice(i, 1)[0][0];
        for(var j = 0; j < unlocked.length; j++){
          lockedStus[unlocked[j].user.uid] = false; //unlock the students in the group
        }      
        return "unlocked";
      }
    }

    var index = $scope.groups.indexOf(group);
    $scope.lockedGroups.push([group, index]); //track the pair
    for(var j = 0; j < group.length; j++){
      lockedStus[group[j].user.uid] = true; //make sure the students don't get reshuffled
    }
    return "locked";
  }

  $scope.searchLockedGroups = function(group){
    for(var i = 0; i < $scope.lockedGroups.length; i++){
      if($scope.lockedGroups[i][0] === group){ //found the group in the locked groups
        return true;
      }
    }
    return false;    
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

