angular.module('PU.poolPage', ['PU.factories'])

.controller('PoolPageController', function ($scope, $routeParams, MakerPass, $location, $route, $http, StateSaver, DB, CurrentUser){

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
  $scope.noRepeats = true;
  $scope.idMap = {};
  var groupSize = 2;
  var timeoutCounter = 0;
  var timeoutThreshold = 5000;

  var init = (function(){ //function that runs on load; it'll call all the fns to set up the page
    $scope.loading = true;
    CurrentUser.get()
    .then(function(user){
      $scope.currentUser = user;
      DB.getPool($routeParams.poolId)
      .then(function(poolInfo){
        console.log("PoolInfo: ", poolInfo);
        $scope.currPool = poolInfo;
        groupSize = poolInfo.group_size;
        DB.getMemberships(poolInfo)
        .then(function(members){
          var partOfGroup = false;
          for(var i = 0; i < members.length; i++){
            if(members[i].role === 'student'){
              if(members[i].uid === $scope.currentUser.uid){
                $scope.stuView = true;
                partOfGroup = true;
              }
              $scope.students.push(members[i]);
              console.log("Students: ", $scope.students);
            }else if(members[i].role === 'fellow' || members[i].role === 'instructor'){
              $scope.admins.push(members[i]);
              if(members[i].uid === $scope.currentUser.uid){
                partOfGroup = true;
              }
            }
          }
          $scope.makeMap();
          if(!partOfGroup){
            $scope.stuView = true;
          }
          refreshGroupings()
          .then(function(){
            $scope.loading = false;
          });
        })
    })
    })
  }())

  var refreshGroupings = function(){
    return DB.getPairs($scope.currPool)
    .then(function(groupings){
      console.log("Data from getPairs: ", groupings);
      $scope.pastGroupings = groupings;
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
    })
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
    $scope.randomize();
    $scope.creatingGrouping = true;
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
      $scope.groups[$scope.lockedStus[s]].push($scope.idMap[s]);
    }
    var stus = $scope.students.filter(function(stu){
      return !Number.isInteger($scope.lockedStus[stu.user.uid]); //don't shuffle the locked students
    })

    var shuffled = [];
    for(var i = 0; i < stus.length % groupSize; i++){
      stus.push({user: {name: "Code Monkey", uid: "-" + i, avatar_url:'https://s-media-cache-ak0.pinimg.com/564x/7e/e7/fe/7ee7fe7d2753c6c47715a95c8508533d.jpg'}}); //give them decrementing ids
    }

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

    checkClashes();
    $scope.partnerUp = true;
    $scope.finalized = false;
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
    console.log("Calling randomize");
    $scope.groupingName = "";
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
      alert(`Uh oh! We were unable to generate a list without repeating pairs; this is likely because ` +
      `most of the possible pairs, if not all of them, have already occurred. Here's a random list anyway. Sorry!`);
      timeoutCounter = 0;
      return $scope.trueRandomize();
    }
    
    for(var i = 0; i < $scope.students.length / groupSize; i++){
      $scope.groups[i] = [];
    }
    for(var s in $scope.lockedStus){
      $scope.groups[$scope.lockedStus[s]].push($scope.idMap[s]);
    }
    console.log("Groups: ", $scope.groups);
    var stus = $scope.students.slice();
    for(var i = 0; i < stus.length % groupSize; i++){
      stus.push({user: {name: "Code Monkey", uid: "-" + i, avatar_url:'https://s-media-cache-ak0.pinimg.com/564x/7e/e7/fe/7ee7fe7d2753c6c47715a95c8508533d.jpg'}});
    }
    stus = stus.filter(function(stu){
      console.log("Locked stus index: ", $scope.lockedStus[stu.user.uid]);
      return !Number.isInteger($scope.lockedStus[stu.user.uid]); //don't shuffle the locked students
    })
    console.log("Stus: ", stus);

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
        console.log("Failed");
        return $scope.randomize(groupSize);
      }
    }
    $scope.partnerUp = true;
    $scope.finalized = false;
    checkClashes();
    timeoutCounter = 0;
    $scope.loadingGroups = false;
    return $scope.groups;
  }

  $scope.filterGroupsByName = function(group){
    if(!$scope.groupSearch) return true;
    var search = $scope.groupSearch.toLowerCase();
    return group.filter(stu => stu.user.name.toLowerCase().includes(search)).length;
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
    $scope.creatingGrouping = false;
    if($scope.groupingName && $scope.groupingName.length){      
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
      DB.addPairs($scope.currPool, newPairs, $scope.groupingName, groupSize)
      .then(function(){
        refreshGroupings()
        .then(function(){
          $scope.loading = false;
        })
      })
      //$scope.groupingName = "";
    }else{
      alert("Please enter a title for this class list");
    }
  }

  $scope.toggleLockStu = function(stu){
    var index = searchGroupsForStu(stu);
    if(!Number.isInteger($scope.lockedStus[stu.user.uid])){
      if(index !== -1){
        $scope.lockedStus[stu.user.uid] = index;
      }
      if(groupSize === 2){
        for(var i = 0; i < $scope.groups[index].length; i++){
          $scope.lockedStus[$scope.groups[index][i].user.uid] = index;
        }
      }else{
        console.error("Error locking student: student not found in groups")
      }
    }else{
      if(groupSize === 2){
        for(var i = 0; i < $scope.groups[index].length; i++){
          delete $scope.lockedStus[$scope.groups[index][i].user.uid];
        }
      }
      delete $scope.lockedStus[stu.user.uid];
    }
  }

  var searchGroupsForStu = function(stu){
    for(var i = 0; i < $scope.groups.length; i++){
      for(var j = 0; j < $scope.groups[i].length; j++){
        if($scope.groups[i][j] === stu){
          return i;
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

})