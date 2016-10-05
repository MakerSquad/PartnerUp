angular.module('PU.demoPoolPage', ['PU.factories'])

.controller('DemoPoolPageController', function ($scope, $routeParams, $location, $route, $http){
  document.getElementById("bodyclass").className = "";
  $scope.pastGroupings = [];
  $scope.currPool;
  $scope.pastPairs = {};
  $scope.pastGroupingData = [];
  $scope.loading = true;
  $scope.students = [];
  $scope.admins = [];
  $scope.groups = [];
  $scope.clashes = [];
  $scope.lockedStus = {};
  $scope.stuView = false;
  $scope.currentUser;
  $scope.creatingGrouping = false;
  $scope.selectedForSwap = null;
  $scope.selectedForSwapIndex = null;
  $scope.noRepeats = true;
  $scope.idMap = {};
  $scope.alreadyFailed = false;
  $scope.error = "";
  var groupSize = 2;
  var timeoutCounter = 0;
  var timeoutThreshold = 5000;

  var refreshGroupings = function(){
    var groupings = window.pastGroupings[$routeParams.poolId - 1];
    $scope.pastGroupings = groupings.reverse();
    for(var i = 0; i < $scope.pastGroupings.length; i++){
      $scope.pastGroupings[i].groups = createGroupings($scope.pastGroupings[i].pairs);
      $scope.pastGroupings[i].pairs.forEach(function(pair){
        if(!$scope.pastPairs[pair.user1_uid]){
          $scope.pastPairs[pair.user1_uid] = {};
        }
        if(!$scope.pastPairs[pair.user2_uid]){
          $scope.pastPairs[pair.user2_uid] = {};
        }
        $scope.pastPairs[pair.user1_uid][pair.user2_uid] = true;
        $scope.pastPairs[pair.user2_uid][pair.user1_uid] = true;
      })
    }
  }

  $scope.filterGroupsByName = function(group){
    if(!$scope.stuSearch) return true;
    var search = $scope.stuSearch.toLowerCase();
    return group.filter(stu => stu.user.name.toLowerCase().includes(search)).length;
  }

  var createGroupings = function(pairs){
    var pastGroupings = {};
    var seen = {}; //object of objects
    for(var i = 0; i < pairs.length; i++){
      var currPair = pairs[i];
      var currUser1 = currPair.user1_uid;
      if(seen[currUser1]){
        continue;
      }
      var currUser2 = currPair.user2_uid;
      if(!pastGroupings[currUser1]){
        pastGroupings[currUser1] = [currUser1];
      }
      pastGroupings[currUser1].push(currUser2);
      seen[currUser2] = true;
    }
    var grpArray = [];
    for(var grp in pastGroupings){
      grpArray.push(pastGroupings[grp])
    }
    return grpArray;
  }

  $scope.startNewGrouping = function(){
    if($scope.loadingNewGrouping){
      return; //in case user double clicks the button
    }
    if($scope.creatingGrouping){
      $scope.creatingGrouping = false;
      return;
    }
    $scope.loadingNewGrouping = true;
    $scope.creatingGrouping = true;
    $scope.groupingName = "";
    console.log("Loading new Grouping? : ", $scope.loadingNewGrouping);
    $scope.randomize();
    $scope.loadingNewGrouping = false;
  }

  /**
  * Takes a number and generates an array that contains indexes from 0 to that number
  * (Used to ng-repeat for a specific number)
  * @param num : The size of the array
  * @return An array of size num; each cell contains its index as a number
  */
  $scope.getIndexArray = function(num){
    var arr = [];
    for(var i = 0; i < num; i++){
      arr[i] = i;
    }
    return arr;
  }

  $scope.makeMap = function(){
    for(var i = 0; i < $scope.students.length; i++){
      $scope.idMap[$scope.students[i].user.uid] = $scope.students[i];
    }
  }

  /**
  * trueRandomize generates a completely random grouping of the current students, disregarding pair history
  * trueRandomize is called if our loop threshold is reached before we are able to resolve clashes
  * @param groupSize : The size of the groups to generate
  * @return $scope.groups, after it has been updated
  */

  $scope.trueRandomize = function(){
    for(var i = 0; i < $scope.groups.length; i++){
      $scope.groups[i] = [];
    }
    for(var s in $scope.lockedStus){
      $scope.groups[$scope.lockedStus[s][0]].push($scope.idMap[s]);
    }
    var stus = $scope.students.filter(function(stu){
      return !$scope.lockedStus[stu.user.uid]; //don't shuffle the locked students
    })

    var shuffled = [];

    while(stus.length){
      var randInd = Math.floor(Math.random() * stus.length);
      shuffled.push(stus.splice(randInd, 1)[0]);
    }

    var currGroupInd = 0;
    while(shuffled.length){
      var grp = $scope.groups[currGroupInd];
      while(grp.length < groupSize){
        grp.push(shuffled.splice(0, 1)[0]);
      }
      currGroupInd += 1;
    }

    swapLockedStusBack();
    checkClashes();
    $scope.partnerUp = true;
    $scope.loadingGroups = false;
    console.log("Groups after randomize: ", $scope.groups);
    return $scope.groups;
  }

  /**
  * Randomize generates a grouping of the current students, attempting to avoid clashes
  * Recursively calls itself if we were unable to make non-repeating groups; if this recursion occurs
  * too many times, the user is alerted, and trueRandomize is called instead
  * @param groupSize : The size of the groups to generate
  * @return $scope.groups, after it has been updated
  */

  $scope.randomize = function(){
    $scope.loadingGroups = true;
    if(!groupSize){
      groupSize = 2; //default group size to 2
    }
    groupSize = Number(groupSize);
    timeoutCounter += 1;

    if(!$scope.noRepeats){
      return $scope.trueRandomize();
    }

    if(timeoutCounter > timeoutThreshold){
      if(!$scope.alreadyFailed){
        alert(`Uh oh! We were unable to generate a list without repeating pairs; this is likely because ` +
        `most of the possible pairs, if not all of them, have already occurred. Here's a random list anyway. Sorry!`);
      }
      timeoutCounter = 0;
      $scope.alreadyFailed = true;
      return $scope.trueRandomize();
    }
    
    for(var i = 0; i < $scope.students.length / groupSize; i++){
      $scope.groups[i] = [];
    }
    for(var s in $scope.lockedStus){
      $scope.groups[$scope.lockedStus[s][0]].push($scope.idMap[s]);
    }
    var stus = $scope.students.slice();

    stus = stus.filter(function(stu){
      return !$scope.lockedStus[stu.user.uid]; //don't shuffle the locked students
    })

    var shuffled = [];

    while(stus.length){
      var randInd = Math.floor(Math.random() * stus.length);
      shuffled.push(stus.splice(randInd, 1)[0]);
    }

    var currGroupInd = 0;
    while(shuffled.length){
      var first = shuffled[0];
      var group = $scope.groups[currGroupInd];
      var start = 0;
      if(!group.length){
        group.push(first);
        start = 1;
      }
      for(var j = start; j < shuffled.length; j++){
        var failed = true;
        if(group.length === groupSize) {
          failed = false;
          currGroupInd += 1;
          break;
        }
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
          j--;
        }else{
          continue;
        }
        if(group.length === groupSize){
          currGroupInd += 1;
          if(start) shuffled.splice(0, 1);
          failed = false;
          break;
        }
      }
      if(failed){
        return $scope.randomize(groupSize);
      }
    }
    $scope.partnerUp = true;
    swapLockedStusBack();
    checkClashes();
    timeoutCounter = 0;
    $scope.loadingGroups = false;
    return $scope.groups;
  }

  var swapLockedStusBack = function(){
    for(var s in $scope.lockedStus){
      var currGroup = $scope.lockedStus[s][0];
      var currIndex = [currGroup, $scope.groups[currGroup].indexOf($scope.idMap[s])];
      swapStus(currIndex, $scope.lockedStus[s])
    }
  }

  $scope.filterGroupsByName = function(group){
    if(!$scope.stuSearch) return true;
    var search = $scope.stuSearch.toLowerCase();
    return group.filter(stu => $scope.idMap[stu].user.name.toLowerCase().includes(search)).length;
  }

  /**
  * CheckClashes checks the current groups for any groups in which students have previously worked together
  * Any clashing groups will be pushed to $scope.groups
  */

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

  /**
  * Finalize takes the current pairings and records them into the "past pairs" object
  */

  $scope.finalize = function(){
    $scope.loading = true;
    if($scope.groupingName && $scope.groupingName.length){      
      $scope.creatingGrouping = false;
      var newPairs = [];
      for(var i = 0; i < $scope.groups.length; i++){
        for(var j = 0; j < $scope.groups[i].length; j++){
          for(var k = j+1; k < $scope.groups[i].length; k++){
            if(!$scope.pastPairs[$scope.groups[i][j].user.uid]){
              $scope.pastPairs[$scope.groups[i][j].user.uid] = {};
            }
            $scope.pastPairs[$scope.groups[i][j].user.uid][$scope.groups[i][k].user.uid] = true;
            newPairs.push([$scope.groups[i][j].user.uid, $scope.groups[i][k].user.uid]); //new pairs to save in DB
            if(!$scope.pastPairs[$scope.groups[i][k].user.uid]){
              $scope.pastPairs[$scope.groups[i][k].user.uid] = {};
            }
            $scope.pastPairs[$scope.groups[i][k].user.uid][$scope.groups[i][j].user.uid] = true; 
          }
        }
      }
      var np = [];
      for(var i = 0; i < newPairs.length; i++){
        np.push({
          user1_uid: newPairs[i][0],
          user2_uid: newPairs[i][1]
        })
      }
      window.pastGroupings[$routeParams.poolId-1].push(
      {
        generationData: {
          title: $scope.groupingName,
          gen_id: window.pastGroupings[$routeParams.poolId-1].length,
          group_id: $routeParams.poolId,
          group_size: groupSize
        },
        pairs: np
      });
      refreshGroupings();
      $scope.alreadyFailed = false;
      $scope.loading = false;
      // DB.addPairs($scope.currPool, newPairs, $scope.groupingName, groupSize)
      // .then(function(){
      //   refreshGroupings()
      //   .then(function(){
      //     $scope.alreadyFailed = false;
      //     $scope.loading = false;
      //   })
      // })
      //$scope.groupingName = "";
    }else{
      alert("Please enter a title for this class list");
      $scope.loading = false;
    }
  }

  $scope.toggleLockStu = function(stu){
    var index = searchGroupsForStu(stu);
    if(!$scope.lockedStus[stu.user.uid]){
      if(index !== -1){
        $scope.lockedStus[stu.user.uid] = index;
      }
      if(groupSize === 2){
        for(var i = 0; i < $scope.groups[index[0]].length; i++){
          $scope.lockedStus[$scope.groups[index[0]][i].user.uid] = [index[0], i];
        }
      }
    }else{
      if(groupSize === 2){
        for(var i = 0; i < $scope.groups[index[0]].length; i++){
          delete $scope.lockedStus[$scope.groups[index[0]][i].user.uid];
        }
      }
      delete $scope.lockedStus[stu.user.uid];
    }
  }

  var searchGroupsForStu = function(stu){
    for(var i = 0; i < $scope.groups.length; i++){
      for(var j = 0; j < $scope.groups[i].length; j++){
        if($scope.groups[i][j] === stu){
          return [i, j];
        }
      }
    }
    return -1;
  }

  $scope.filterGroupingsByName = function(grouping){
    if(!$scope.searchHist) return true;
    var search = $scope.searchHist.toLowerCase();
    return grouping.generationData.title.toLowerCase().includes(search)
  }

  //Functions for rearranging students

  /**
  * selectForSwap takes in a student object from groups. If another student is currently selected, they will be swapped
  * If no other student is currently selected, the passed in student will be selected
  * If the student passed in is the same as the currently selected student, they will be unselected
  * Students that have been locked in place cannot be selected
  * @param student The student object that has been selected
  */

  $scope.selectForSwap = function(student){
    if($scope.stuView){
      return;
    }
    if($scope.lockedStus[student.user.uid]){
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
    }
    checkClashes();
  }

  /**
  * searchForSelected is a helper function for selectForSwap
  * searchForSelected takes in a student object and searches the groups for its index
  * @param student The student object to search for
  * @return The index tuple for the student's location in groups; if the student is not found, returns undefined
  */

  var searchForSelected = function(student){
    for(var i = 0; i < $scope.groups.length; i++){
      for(var j = 0; j < $scope.groups[i].length; j++){
        if($scope.groups[i][j] === student){
          return [i, j];
        }
      }
    }
  }

  /**
  * swapStus is a helper function for selectForSwap
  * swapStus takes in 2 index tuples from $scope.groups and swaps the students in those locations
  * @param indexTuple1 The index of the first student selected to swap
  * @param indexTuple2 The index of the second student selected to swap
  */

  var swapStus = function(indexTuple1, indexTuple2){
    var tmp = $scope.groups[indexTuple1[0]][indexTuple1[1]];
    $scope.groups[indexTuple1[0]][indexTuple1[1]] = $scope.groups[indexTuple2[0]][indexTuple2[1]]
    $scope.groups[indexTuple2[0]][indexTuple2[1]] = tmp;
  }

  $scope.deleteGrouping = function(group){
    console.log('dadadadadda', group)
    if(confirm("Are you sure you want to delete this grouping? Once deleted, its gone forever!")){
      window.pastGroupings[$routeParams.poolId-1].splice(
        group.gen_id-1, 1);
      refreshGroupings();
    }
  }

  $scope.goToHistory = function(user){
    if(!$scope.stuView){
      if(/-\d?\d?\d?/.test(user.user.uid)){
        alert(`Quack.\n   __\n<(o )___\n ( ._>  /\n  '---'`);
        return;
      }
      $location.path(`/demo/users/${user.user.uid}`);
    }
  }

  var init = (function(){ //function that runs on load; it'll call all the fns to set up the page
    new Clipboard('.clipyclip');
    if(!window.currentUser){
      $location.path('/demo');
      return;      
    }
    $scope.loading = true;
    $scope.currentUser = window.currentUser;
    poolInfo = window.pools[$routeParams.poolId - 1];
    if(!poolInfo){
      $scope.error = "Whoops, no pool here (neither swimming nor billiards)";
      $scope.loading = false;
      return;
    }
    $scope.currPool = poolInfo;
    groupSize = poolInfo.size;
    var members = window.poolMemberships[$routeParams.poolId - 1];
    var partOfGroup = false;
    for(var i = 0; i < members.length; i++){
      if(members[i].role === 'student'){
        if(members[i].user.uid === $scope.currentUser.uid){
          $scope.stuView = true;
          partOfGroup = true;
        }
        $scope.students.push(members[i]);
        console.log("Students: ", $scope.students);
      }else if(members[i].role === 'fellow' || members[i].role === 'instructor'){
        $scope.admins.push(members[i]);
        if(members[i].user.uid === $scope.currentUser.uid){
          partOfGroup = true;
        }
      }else if(members[i].role === 'memberAdmin'){
        $scope.students.push(members[i]);
        $scope.admins.push(members[i]);
        if(members[i].user.uid === $scope.currentUser.uid){
          partOfGroup = true;
        }
      }
    }

    for(var j = 0; j < $scope.students.length % groupSize; j++){
      $scope.students.push({user: {name: "Rubber Duck Debugger", uid: "-" + j, avatar_url:'../../assets/rubberducky.png'}}); //give them decrementing ids
    }
    console.log("$scope.students: ", $scope.students);

    $scope.makeMap();
    if(!partOfGroup){
      $scope.stuView = true;
    }
    refreshGroupings();
    $scope.loading = false;
  }())

})