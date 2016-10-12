angular.module('PU.poolPage', ['PU.factories'])

.controller('PoolPageController', function($scope, $routeParams, MakerPass, $location, $route, $http, DB, CurrentUser) {
  $scope.pastGroupings = [];
  $scope.currPool = {};
  $scope.pastPairs = {};
  $scope.pastGroupingData = [];
  $scope.loading = true;
  $scope.students = [];
  $scope.admins = [];
  $scope.groups = [];
  $scope.clashes = [];
  $scope.lockedStus = {};
  $scope.stuView = false;
  $scope.currentUser = {};
  $scope.creatingGrouping = false;
  $scope.selectedForSwap = null;
  $scope.selectedForSwapIndex = null;
  $scope.noRepeats = true;
  $scope.idMap = {};
  $scope.alreadyFailed = false;
  $scope.error = "";
  var groupSize = 2;
  var timeoutCounter = 0;
  var timeoutThreshold = 4000;

  /**
  * The init function sets up the page, loading all the necessary data from the back end
  * before showing the page content (via $scope.loading). The init function loads the pool info,
  * the members of the pool, the past pairs, and all the past groupings. If any of the database calls
  * fail, the init function will render an error
  */

  var init = (function() {
    new Clipboard('.clipyclip');
    $scope.loading = true;
    CurrentUser.get()
    .then(function(user) {
      $scope.currentUser = user;
      DB.getPool($routeParams.poolId)
      .then(function(poolInfo) {
        if (!poolInfo) {
          $scope.error = "Whoops, no pool here (neither swimming nor billiards)";
          $scope.loading = false;
          return;
        }
        $scope.currPool = poolInfo;
        groupSize = poolInfo.group_size;
        DB.getMemberships(poolInfo)
        .then(function(members) {
          var partOfGroup = false;
          for (var i = 0; i < members.length; i++) {
            if (members[i].role === 'student') {
              if (members[i].user.uid === $scope.currentUser.uid) {
                $scope.stuView = true;
                partOfGroup = true;
              }
              $scope.students.push(members[i]);
            } else if (members[i].role === 'fellow' || members[i].role === 'instructor') {
              $scope.admins.push(members[i]);
              if (members[i].user.uid === $scope.currentUser.uid) {
                partOfGroup = true;
              }
            } else if (members[i].role === 'memberAdmin') {
              $scope.students.push(members[i]);
              $scope.admins.push(members[i]);
              if (members[i].user.uid === $scope.currentUser.uid) {
                partOfGroup = true;
              }
            }
          }

          for (var j = 0; j < $scope.students.length % groupSize; j++) {
            $scope.students.push({user: {name: "Rubber Duck Debugger", uid: "-" + j, avatar_url: '../../assets/rubberducky.png'}}); //  give them decrementing ids
          }

          $scope.makeMap();
          if (!partOfGroup) {
            $scope.stuView = true;
          }
          refreshGroupings()
          .then(function() {
            $scope.loading = false;
          })
          .catch(function(err) {
            $scope.error = "Error: " + err;
            $scope.loading = false;
          });
        })
        .catch(function(err) {
          console.error("Error loading pool members: ", err);
          $scope.error = "Something went wrong getting the members of this pool! (Don't blame me, I'm just the front-end developer)";
          $scope.loading = false;
        });
      })
      .catch(function(err) {
        console.error("Error getting pool: ", err);
        $scope.error = "Um, that pool doesn't seem valid. Could be our fault (but it's probably yours) (pools are designated by numbers)";
        $scope.loading = false;
      });
    })
    .catch(function(err) {
      console.error("Error initializing page: ", err);
      $scope.error = "Error initializing page: " + err;
      $scope.loading = false;
      $location.path('/signin');
      $scope.$apply();
    });
  })();

  /**
  * RefreshGroupings retrieves the past pairs from the back end and stores them in memory
  * to avoid repeats. RefreshGroupings also calls createGroupings to generate the past groupings
  * from the retrieved pairs.
  */

  var refreshGroupings = function() {
    return DB.getPairs($scope.currPool)
    .then(function(groupings) {
      $scope.pastGroupings = groupings.reverse();
      for (var i = 0; i < $scope.pastGroupings.length; i++) {
        $scope.pastGroupings[i].groups = createGroupings($scope.pastGroupings[i].pairs);
        $scope.pastGroupings[i].pairs.forEach(function(pair) {
          if (!$scope.pastPairs[pair.user1_uid]) {
            $scope.pastPairs[pair.user1_uid] = {};
          }
          if (!$scope.pastPairs[pair.user2_uid]) {
            $scope.pastPairs[pair.user2_uid] = {};
          }
          $scope.pastPairs[pair.user1_uid][pair.user2_uid] = true;
          $scope.pastPairs[pair.user2_uid][pair.user1_uid] = true;
        });
      }
    });
  };

  /**
  * CreateGroupings is a helper function for refreshGroupings that takes in a list of past pairs
  * and uses them to generate full groupings (for when group size is larger than just 2).
  * @param pairs A list of the pairs for a grouping
  * @return an array of full groupings
  */

  var createGroupings = function(pairs) {
    var pastGroupings = {};
    var seen = {}; // object of objects
    for (var i = 0; i < pairs.length; i++) {
      var currPair = pairs[i];
      var currUser1 = currPair.user1_uid;
      if (seen[currUser1]) {
        continue;
      }
      var currUser2 = currPair.user2_uid;
      if (!pastGroupings[currUser1]) {
        pastGroupings[currUser1] = [currUser1];
      }
      pastGroupings[currUser1].push(currUser2);
      seen[currUser2] = true;
    }
    var grpArray = [];
    for (var grp in pastGroupings) {
      grpArray.push(pastGroupings[grp]);
    }
    return grpArray;
  };

  /**
  * StartNewGrouping is the function called when the "organize new grouping" button
  * is clicked. It changes the state to show the controls for creating a new grouping
  * and calls randomize to generate a new grouping
  */

  $scope.startNewGrouping = function() {
    if ($scope.loadingNewGrouping) {
      return; //  in case user double clicks the button
    }
    if ($scope.creatingGrouping) {
      $scope.creatingGrouping = false;
      return;
    }
    $scope.loadingNewGrouping = true;
    $scope.creatingGrouping = true;
    $scope.groupingName = "";
    $scope.randomize();
    $scope.loadingNewGrouping = false;
  };

  /**
  * Takes a number and generates an array that contains indexes from 0 to that number
  * (Used to ng-repeat for a specific number)
  * @param {number} num : The size of the array
  * @return {array} An array of size num; each cell contains its index as a number
  */

  $scope.getIndexArray = function(num) {
    var arr = [];
    for (var i = 0; i < num; i++) {
      arr[i] = i;
    }
    return arr;
  };

  /**
  * makeMap generates an object that maps student uids to the full student objects.
  * This map is used to quickly lookup the students in the cases where we only have ids
  */

  $scope.makeMap = function() {
    for (var i = 0; i < $scope.students.length; i++) {
      $scope.idMap[$scope.students[i].user.uid] = $scope.students[i];
    }
  };

  /**
  * trueRandomize generates a completely random grouping of the current students, disregarding pair history
  * trueRandomize is called if our loop threshold is reached before we are able to resolve clashes
  * @return {array} $scope.groups, after it has been updated
  */

  $scope.trueRandomize = function() {
    for (var i = 0; i < $scope.groups.length; i++) {
      $scope.groups[i] = [];
    }
    for (var s in $scope.lockedStus) {
      $scope.groups[$scope.lockedStus[s][0]].push($scope.idMap[s]);
    }
    var stus = $scope.students.filter(function(stu) {
      return !$scope.lockedStus[stu.user.uid]; // don't shuffle the locked students
    });

    var shuffled = [];

    while (stus.length) {
      var randInd = Math.floor(Math.random() * stus.length);
      shuffled.push(stus.splice(randInd, 1)[0]);
    }

    var currGroupInd = 0;
    while (shuffled.length) {
      var grp = $scope.groups[currGroupInd];
      while (grp.length < groupSize) {
        grp.push(shuffled.splice(0, 1)[0]);
      }
      currGroupInd += 1;
    }

    swapLockedStusBack();
    checkClashes();
    $scope.partnerUp = true;
    $scope.loadingGroups = false;
    return $scope.groups;
  };

  /**
  * Randomize generates a grouping of the current students, attempting to avoid clashes
  * Recursively calls itself if we were unable to make non-repeating groups; if this recursion occurs
  * too many times, the user is alerted, and trueRandomize is called instead
  * @return {array} $scope.groups, after it has been updated
  */

  $scope.randomize = function() {
    $scope.loadingGroups = true;
    if (!groupSize) {
      groupSize = 2; // default group size to 2
    }
    groupSize = Number(groupSize);
    timeoutCounter += 1;

    if (!$scope.noRepeats) {
      return $scope.trueRandomize();
    }

    if (timeoutCounter > timeoutThreshold) {
      if (!$scope.alreadyFailed) {
        alert(`Uh oh! We were unable to generate a list without repeating pairs; this is likely because ` +
        `most of the possible pairs, if not all of them, have already occurred. Here's a random list anyway. Sorry!`);
      }
      timeoutCounter = 0;
      $scope.alreadyFailed = true;
      return $scope.trueRandomize();
    }

    for (var i = 0; i < $scope.students.length / groupSize; i++) {
      $scope.groups[i] = [];
    }
    for (var s in $scope.lockedStus) {
      $scope.groups[$scope.lockedStus[s][0]].push($scope.idMap[s]);
    }
    var stus = $scope.students.slice();

    stus = stus.filter(function(stu) {
      return !$scope.lockedStus[stu.user.uid]; // don't shuffle the locked students
    });

    var shuffled = [];

    while (stus.length) {
      var randInd = Math.floor(Math.random() * stus.length);
      shuffled.push(stus.splice(randInd, 1)[0]);
    }

    var currGroupInd = 0;
    while (shuffled.length) {
      var first = shuffled[0];
      var group = $scope.groups[currGroupInd];
      var start = 0;
      if (!group.length) {
        group.push(first);
        start = 1;
      }
      var failed = true;
      for (var j = start; j < shuffled.length; j++) {
        failed = true;
        if (group.length === groupSize) {
          failed = false;
          currGroupInd += 1;
          break;
        }
        var noClashes = true;
        for (var k = 0; k < group.length; k++) {
          if ($scope.pastPairs[group[k].user.uid]) {
            if ($scope.pastPairs[group[k].user.uid][shuffled[j].user.uid]) {
              noClashes = false;
              break;
            }
          }
        }
        if (noClashes) {
          group.push(shuffled[j]);
          shuffled.splice(j, 1);
          j--;
        } else {
          continue;
        }
        if (group.length === groupSize) {
          currGroupInd += 1;
          if (start) {
            shuffled.splice(0, 1);
          }
          failed = false;
          break;
        }
      }
      if (failed) {
        return $scope.randomize(groupSize);
      }
    }
    $scope.partnerUp = true;
    swapLockedStusBack();
    checkClashes();
    timeoutCounter = 0;
    $scope.loadingGroups = false;
    return $scope.groups;
  };

  /**
  * SwapLockedStusBack is a helper function to the two randomize functions.
  * It is called after randomizing a grouping to place students marked as "locked"
  * back into their original positions, giving the illusion that they haven't moved
  */

  var swapLockedStusBack = function() {
    for (var s in $scope.lockedStus) {
      var currGroup = $scope.lockedStus[s][0];
      var currIndex = [currGroup, $scope.groups[currGroup].indexOf($scope.idMap[s])];
      swapStus(currIndex, $scope.lockedStus[s]);
    }
  };

  /**
  * FilterGroupsByName is a function used in the html to search the rendered groups
  * by student names
  * @param group the group being searched
  * @return true if any student name in the group contains $scope.search, false otherwise
  */

  $scope.filterGroupsByName = function(group) {
    if (!$scope.stuSearch) {
      return true;
    }
    var search = $scope.stuSearch.toLowerCase();
    return group.filter(stu => $scope.idMap[stu].user.name.toLowerCase().includes(search)).length;
  };

  /**
  * FilterGroupingsByName is a function used to search the groupings by title
  * The search parameter is defined by an input box in the HTML
  * @param grouping the grouping being searched
  * @return true if the grouping title contains $scope.searchHist, or false otherwise
  */

  $scope.filterGroupingsByName = function(grouping) {
    if (!$scope.searchHist) {
      return true;
    }
    var search = $scope.searchHist.toLowerCase();
    return grouping.generationData.title.toLowerCase().includes(search);
  };

  /**
  * CheckClashes checks the current groups for any groups in which students have previously worked together
  * Any clashing groups will be pushed to $scope.clashes
  * checkClashes is called by the randomize functions, and after swapping students
  */

  var checkClashes = function() {
    $scope.clashes = [];
    for (var i = 0; i < $scope.groups.length; i++) {
      var group = $scope.groups[i];
      for (var j = 0; j < group.length; j++) {
        var pushed = false;
        for (var k = j; k < group.length; k++) {
          if ($scope.pastPairs[group[j].user.uid]) {
            if ($scope.pastPairs[group[j].user.uid][group[k].user.uid]) {
              $scope.clashes.push(group);
              pushed = true;
              break;
            }
          }
        }
        if (pushed) {
          break;
        }
      }
    }
  };

  /**
  * alphabetizeGroups is a helper function to finalize that alphabetizes
  * $scope.groups. Students are alphabetized within the groups first (Rubber ducks
  * are always put at the end), then the groups are alphabetized by the first student's name
  */

  var alphabetizeGroups = function() {
    for (var i = 0; i < $scope.groups.length; i++) {
      $scope.groups[i].sort(function(a, b) {
        if (/-\d+/.test(a.user.uid)) { //  rubber duck
          return 1;
        }
        if (/-\d+/.test(b.user.uid)) {
          return -1;
        }
        return a.user.name.toLowerCase() < b.user.name.toLowerCase() ?
        -1 : 1;
      });
    }
    $scope.groups.sort(function(grp1, grp2) {
      var a = grp1[0];
      var b = grp2[0];
      if (/-\d+/.test(a.user.uid)) { //  rubber duck
        return 1;
      }
      if (/-\d+/.test(b.user.uid)) {
        return -1;
      }
      return a.user.name.toLowerCase() < b.user.name.toLowerCase() ?
      -1 : 1;
    });
  };

  /**
  * Finalize is called when a user is happy with the new grouping.
  * Finalize takes the current pairings and records them into the "past pairs" object,
  * as well as sending them to the back-end for persisting storage
  * Finalize also calls refreshGroupings after the database finishes storing the pairs
  */

  $scope.finalize = function() {
    $scope.loading = true;
    alphabetizeGroups();
    if ($scope.groupingName && $scope.groupingName.length) {
      $scope.creatingGrouping = false;
      var newPairs = [];
      for (var i = 0; i < $scope.groups.length; i++) {
        for (var j = 0; j < $scope.groups[i].length; j++) {
          for (var k = j + 1; k < $scope.groups[i].length; k++) {
            if (!$scope.pastPairs[$scope.groups[i][j].user.uid]) {
              $scope.pastPairs[$scope.groups[i][j].user.uid] = {};
            }
            $scope.pastPairs[$scope.groups[i][j].user.uid][$scope.groups[i][k].user.uid] = true;
            newPairs.push([$scope.groups[i][j].user.uid, $scope.groups[i][k].user.uid]); // new pairs to save in DB
            if (!$scope.pastPairs[$scope.groups[i][k].user.uid]) {
              $scope.pastPairs[$scope.groups[i][k].user.uid] = {};
            }
            $scope.pastPairs[$scope.groups[i][k].user.uid][$scope.groups[i][j].user.uid] = true;
          }
        }
      }
      DB.addPairs($scope.currPool, newPairs, $scope.groupingName, groupSize)
      .then(function() {
        refreshGroupings()
        .then(function() {
          $scope.alreadyFailed = false;
          $scope.loading = false;
        });
      });
      //  $scope.groupingName = "";
    } else {
      alert("Please enter a title for this class list");
      $scope.loading = false;
    }
  };

  /**
  * ToggleLockStu takes a student object and marks it as locked in $scope.lockedStus,
  * or unlocks the student, if they are already locked, by deleting their key in lockedStus.
  * The students are stored in lockedStus by their uids as a key, and as their current indices
  * as values, to allow them to stay in place when the groupings are re-rolled.
  * If groupSize is set to 2, their current partner will be locked as well
  * @param stu The student to lock in place
  */

  $scope.toggleLockStu = function(stu) {
    var index = searchGroupsForStu(stu);
    if (!$scope.lockedStus[stu.user.uid]) {
      if (index !== -1) {
        $scope.lockedStus[stu.user.uid] = index;
      }
      if (groupSize === 2) {
        for (var i = 0; i < $scope.groups[index[0]].length; i++) {
          $scope.lockedStus[$scope.groups[index[0]][i].user.uid] = [index[0], i];
        }
      }
    } else {
      if (groupSize === 2) {
        for (var j = 0; j < $scope.groups[index[0]].length; j++) {
          delete $scope.lockedStus[$scope.groups[index[0]][j].user.uid];
        }
      }
      delete $scope.lockedStus[stu.user.uid];
    }
  };

  /**
  * SearchGroupsForStu takes in a student object and returns the 2-dimensional index
  * where the student is located in $scope.groups
  * @param stu The student being searched for
  * @return The index of the student as a tuple, or -1 if not found
  */

  var searchGroupsForStu = function(stu) {
    for (var i = 0; i < $scope.groups.length; i++) {
      for (var j = 0; j < $scope.groups[i].length; j++) {
        if ($scope.groups[i][j] === stu) {
          return [i, j];
        }
      }
    }
    return -1;
  };

  /**
  * selectForSwap takes in a student object from groups. If another student is currently selected, they will be swapped
  * If no other student is currently selected, the passed in student will be selected
  * If the student passed in is the same as the currently selected student, they will be unselected
  * Students that have been locked in place cannot be selected
  * @param student The student object that has been selected
  */

  $scope.selectForSwap = function(student) {
    if ($scope.stuView) {
      return;
    }
    if ($scope.lockedStus[student.user.uid]) {
      return;
    }
    var selectedIndex = searchForSelected(student);
    if ($scope.selectedForSwap === student) {
      $scope.selectedForSwap = null;
      $scope.selectedForSwapIndex = null;
    } else if ($scope.selectedForSwap === null) {
      $scope.selectedForSwap = student;
      $scope.selectedForSwapIndex = selectedIndex;
    } else {
      swapStus(selectedIndex, $scope.selectedForSwapIndex);
      $scope.selectedForSwap = null;
      $scope.selectedForSwapIndex = null;
    }
    checkClashes();
  };

  /**
  * searchForSelected is a helper function for selectForSwap
  * searchForSelected takes in a student object and searches the groups for its index
  * @param student The student object to search for
  * @return The index tuple for the student's location in groups; if the student is not found, returns undefined
  */

  var searchForSelected = function(student) {
    for (var i = 0; i < $scope.groups.length; i++) {
      for (var j = 0; j < $scope.groups[i].length; j++) {
        if ($scope.groups[i][j] === student) {
          return [i, j];
        }
      }
    }
  };

  /**
  * swapStus is a helper function for selectForSwap
  * swapStus takes in 2 index tuples from $scope.groups and swaps the students in those locations
  * @param indexTuple1 The index of the first student selected to swap
  * @param indexTuple2 The index of the second student selected to swap
  */

  var swapStus = function(indexTuple1, indexTuple2) {
    var tmp = $scope.groups[indexTuple1[0]][indexTuple1[1]];
    $scope.groups[indexTuple1[0]][indexTuple1[1]] = $scope.groups[indexTuple2[0]][indexTuple2[1]];
    $scope.groups[indexTuple2[0]][indexTuple2[1]] = tmp;
  };

  /**
  * deleteGrouping makes a database call to remove a specific grouping
  * The user is first prompted to confirm the deletion
  * After the deletion occurs, the page is reloaded
  * @param group The grouping being deleted
  */

  $scope.deleteGrouping = function(group) {
    if (confirm("Are you sure you want to delete this grouping? Once deleted, its gone forever!")) {
      DB.deleteAGrouping($scope.currPool.id, group.generationData.id)
      .then(function(resp) {
        $route.reload();
      })
      .catch(function(err) {
        console.log(err);
      });
    }
  };

  /**
  * GoToHistory paths the user to a specified user's history page
  * If a Rubber Duck Debugger is selected, the user will receive an alert instead
  * @param user The user whose history will be visited
  */

  $scope.goToHistory = function(user) {
    if (/-\d?\d?\d?/.test(user.user.uid)) {
      alert(`Quack.\n   __\n<(o )___\n ( ._>  /\n  '---'`);
      return;
    }
    $location.path(`/users/${user.user.uid}`);
  };
});
