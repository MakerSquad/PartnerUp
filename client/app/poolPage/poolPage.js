angular.module('PU.poolPage', ['PU.factories'])

.controller('PoolPageController', function($scope, $routeParams, MakerPass, $location, $route, $http, DB, CurrentUser, $anchorScroll) {
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
  $scope.groupSize = 2;
  var timeoutCounter = 0;
  var timeoutThreshold = 4000;
  $scope.editing = false;
  $scope.editedGrouping = null;

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
        $scope.groupSize = poolInfo.group_size;
        DB.getMemberships(poolInfo)
        .then(function(members) {
          var partOfGroup = false;
          for (var i = 0; i < members.length; i++) {
            if (members[i].role === 'student' || members[i].role === 'inactiveStu') {
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
            } else if (members[i].role === 'memberAdmin' || members[i].role === "inactiveMA") {
              $scope.students.push(members[i]);
              $scope.admins.push(members[i]);
              if (members[i].user.uid === $scope.currentUser.uid) {
                partOfGroup = true;
              }
            }
          }

          $scope.makeMap();
          if (!partOfGroup) {
            $scope.stuView = true;
          }
          refreshGroupings()
          .then(function() {
            console.log("$scope.pastGroupings: ", $scope.pastGroupings);
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
      $scope.pastGroupings = groupings.sort((a, b) => {
        return b.generationData.created_at > a.generationData.created_at;
      });
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
      $scope.editedGrouping = null;
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

  $scope.groupSizeString = function(gs) {
    gs = Number(gs);
    var stus = $scope.students.filter(s => s.role === 'student' || s.role === "memberAdmin");
    var numGroups = Math.ceil(stus.length / gs);
    numGroups += numGroups === 1 ? " group" : " groups";
    var remainder = stus.length % gs;
    var size = remainder ? `${gs - 1}-${gs}` : `${gs}`;
    return `${numGroups} of ${size}`;
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
  * studentLookupById uses $scope.idMap to map a student uid to the whole
  * student object. The function is needed to detect Rubber Ducks, which are
  * not stored directly in $scope.idMap
  * @param {string} uid : The uid of the user to look up
  * @return The student object who carries the uid
  */

  $scope.studentLookupById = function(uid) {
    if (/-\d+/.test(uid)) {
      return {user: {name: "Rubber Duck Debugger", uid: uid, avatar_url: '../../assets/rubberducky.png'}};
    }
    return $scope.idMap[uid];
  };

  /**
  * trueRandomize generates a completely random grouping of the current students, disregarding pair history
  * trueRandomize is called if our loop threshold is reached before we are able to resolve clashes
  * @return {array} $scope.groups, after it has been updated
  */

  $scope.trueRandomize = function() {
    $scope.groups = [];
    for (var i = 0; i < Math.ceil($scope.students.length / $scope.groupSize); i++) {
      $scope.groups[i] = [];
    }
    for (var s in $scope.lockedStus) {
      $scope.groups[$scope.lockedStus[s][0]].push($scope.studentLookupById(s));
    }
    var stus = $scope.students.slice();
    stus = stus.filter(function(stu) {
      return stu.role !== "inactiveStu" && stu.role !== "inactiveMA"; // don't shuffle inactive students
    });
    for (var d = 0; d < stus.length % $scope.groupSize; d++) {
      stus.push({user: {name: "Rubber Duck Debugger", uid: "-" + d, avatar_url: '../../assets/rubberducky.png'}}); //  give them decrementing ids
    }
    stus = stus.filter(function(stu) {
      return !$scope.lockedStus[stu.user.uid]; // don't shuffle locked students
    });
    var shuffled = [];

    while (stus.length) {
      var randInd = Math.floor(Math.random() * stus.length);
      shuffled.push(stus.splice(randInd, 1)[0]);
    }

    var currGroupInd = 0;
    while (shuffled.length) {
      var grp = $scope.groups[currGroupInd];
      while (grp.length < $scope.groupSize) {
        grp.push(shuffled.splice(0, 1)[0]);
      }
      currGroupInd += 1;
    }
    removeEmptyGroups();
    swapLockedStusBack();
    checkClashes();
    distributeDucks();
    $scope.partnerUp = true;
    $scope.loadingGroups = false;
    return $scope.groups;
  };

  var removeEmptyGroups = function() {
    return $scope.groups.filter(grp => grp.length > 0);
  };

  /**
  * swapDucksToEnd is a helper function for the randomize functions
  * swapDucksToEnd iterates through $scope.groups and moves all instances of Rubber Ducks
  * to the end of the groups (locked students at the end of groups are left in place)
  */

  var swapDucksToEnd = function() {
    for (var i = 0; i < $scope.groups.length; i++) {
      for (var j = 0; j < $scope.groups[i].length; j++) {
        if (/-\d+/.test($scope.groups[i][j].user.uid)) {
          var toSwapInd = $scope.groups[i].length - 1;
          var toSwap = $scope.groups[i][toSwapInd];
          while ($scope.lockedStus[toSwap.user.uid] ||
          /-\d+/.test(toSwap.user.uid) && toSwapInd > j) {
            toSwapInd -= 1;
            toSwap = $scope.groups[i][toSwapInd];
          }
          if (toSwapInd > j) {
            swapStus([i, j], [i, toSwapInd]); //  swap to end
          }
        }
      }
    }
  };

  /**
  * distributeDucks is a helper function to trueRandomize that
  * swaps ducks to the end of the groups, then makes sure there are no groups
  * with more than 1 rubber duck debugger
  */

  var distributeDucks = function() {
    swapDucksToEnd();
    var duckCount = [];
    var zeros = [];
    var overDucked = [];
    for (var i = 0; i < $scope.groups.length; i++) {
      duckCount[i] = 0;
      for (var j = 0; j < $scope.groups[i].length; j++) {
        if (/-\d+/.test($scope.groups[i][j].user.uid)) {
          duckCount[i] += 1;
          if (duckCount[i] > 1) {
            overDucked.push(i);
          }
        }
      }
      if (duckCount[i] === 0) {
        zeros.push(i);
      }
    }
    for (var d = 0; d < duckCount.length; d++) {
      if (duckCount[d] > 1) {
        var indexOfDuck = 0;
        while (!/-\d+/.test($scope.groups[d][indexOfDuck].user.uid)) {
          indexOfDuck += 1; //  find first index of duck
        }
        var zeroIndex = zeros.pop();
        var studentToSwapIndex = $scope.groups[zeroIndex].length - 1;
        while ($scope.lockedStus[$scope.groups[zeroIndex][studentToSwapIndex].user.uid]) {
          studentToSwapIndex -= 1; // find last index of unlocked student
        }
        swapStus([d, indexOfDuck], [zeroIndex, studentToSwapIndex]);
        duckCount[d] -= 1;
        d -= 1;
      }
    }
  };

  /**
  * Randomize generates a grouping of the current students, attempting to avoid clashes
  * Recursively calls itself if we were unable to make non-repeating groups; if this recursion occurs
  * too many times, the user is alerted, and trueRandomize is called instead
  * @return {array} $scope.groups, after it has been updated
  */

  $scope.randomize = function() {
    $scope.groups = [];
    $scope.loadingGroups = true;
    if (!$scope.groupSize) {
      $scope.groupSize = 2; // default group size to 2
    }
    $scope.groupSize = Number($scope.groupSize);
    timeoutCounter += 1;

    if (timeoutCounter > timeoutThreshold) {
      if (!$scope.alreadyFailed) {
        alert(`Uh oh! We were unable to generate a list without repeating pairs; this is likely because ` +
        `most of the possible pairs, if not all of them, have already occurred. Here's a random list anyway. Sorry!`);
      }
      timeoutCounter = 0;
      $scope.alreadyFailed = true;
      return $scope.trueRandomize();
    }

    for (var i = 0; i < Math.ceil($scope.students.length / $scope.groupSize); i++) {
      $scope.groups[i] = [];
    }
    for (var s in $scope.lockedStus) {
      $scope.groups[$scope.lockedStus[s][0]].push($scope.studentLookupById(s));
    }
    var stus = $scope.students.slice();

    stus = stus.filter(function(stu) {
      return stu.role !== "inactiveStu" && stu.role !== "inactiveMA"; // remove inactive students
    });

    for (var d = 0; d < stus.length % $scope.groupSize; d++) {
      stus.push({user: {name: "Rubber Duck Debugger", uid: "-" + d, avatar_url: '../../assets/rubberducky.png'}}); //  give them decrementing ids
    }

    stus = stus.filter(function(stu) {
      return !$scope.lockedStus[stu.user.uid]; // don't shuffle locked students
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
        if (group.length === $scope.groupSize) {
          failed = false;
          currGroupInd += 1;
          break;
        }
        var noClashes = true;
        for (var k = 0; k < group.length; k++) {
          if (/-\d+/.test(group[k].user.uid) && /-\d+/.test(shuffled[j].user.uid)) {
            noClashes = false;
            break;
          }
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
        if (group.length === $scope.groupSize) {
          currGroupInd += 1;
          if (start) {
            shuffled.splice(0, 1);
          }
          failed = false;
          break;
        }
      }
      if (failed) {
        return $scope.randomize($scope.groupSize);
      }
    }
    $scope.partnerUp = true;
    removeEmptyGroups();
    swapLockedStusBack();
    swapDucksToEnd();
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
      var currIndex = [currGroup, indexOfUid($scope.groups[currGroup], s)];
      swapStus(currIndex, $scope.lockedStus[s]);
    }
  };

  /**
  * IndexOfUid takes in a group of students and a uid, then finds the index
  * of the student object that carries that uid in the group
  * This function is necessary because of complications with indexOf and object equality
  * @param {array} arr : the group to search through
  * @param {string} uid : the uid to look up
  * @return {int} the index of the student within that array
  */

  var indexOfUid = function(arr, uid) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].user.uid === uid) {
        return i;
      }
    }
    return -1;
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
    return group.filter(stu => $scope.studentLookupById(stu).user.name.toLowerCase().includes(search)).length;
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
      if (!$scope.groups[i].length) {
        $scope.groups.splice(i, 1); //  remove any empty arrays
        i -= 1;
        continue;
      }
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
    if ($scope.groupingName && $scope.groupingName.length) {
      alphabetizeGroups();
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
      if (!$scope.editedGrouping) {
        DB.addPairs($scope.currPool, newPairs, $scope.groupingName, $scope.groupSize)
        .then(function() {
          refreshGroupings()
          .then(function() {
            $scope.alreadyFailed = false;
            $scope.loading = false;
            $scope.editedGrouping = null;
          });
        });
      } else {
        DB.editGrouping($scope.currPool, $scope.editedGrouping.id, newPairs, $scope.groupingName, $scope.groupSize)
        .then(function() {
          refreshGroupings()
          .then(function() {
            $scope.alreadyFailed = false;
            $scope.editedGrouping = null;
            $scope.loading = false;
          });
        });
      }
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
  * If $scope.groupSize is set to 2, their current partner will be locked as well
  * @param stu The student to lock in place
  */

  $scope.toggleLockStu = function(stu) {
    var index = searchGroupsForStu(stu);
    if (!$scope.lockedStus[stu.user.uid]) {
      if (index !== -1) {
        $scope.lockedStus[stu.user.uid] = index;
      }
      if ($scope.groupSize === 2) {
        for (var i = 0; i < $scope.groups[index[0]].length; i++) {
          $scope.lockedStus[$scope.groups[index[0]][i].user.uid] = [index[0], i];
        }
      }
    } else {
      if ($scope.groupSize === 2) {
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
    if (!$scope.editedGrouping) {
      checkClashes();
    }
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

  /**
  * deletePool sends a request to the back end to delete the current pool
  * The user is prompted to confirm the deletion before the request is sent
  * After deletion, the user is redirected to the home page
  */

  $scope.deletePool = function() {
    if (confirm("Are you sure you want to delete this pool? You can't get it back")) {
      DB.deletePool($routeParams.poolId)
      .then(function() {
        $location.path('/');
      })
      .catch(function(err) {
        console.error("Error deleting pool: ", err);
        alert(`Whoops, looks like this pool is being difficult and doesn't want to leave.\n
        Here's what it told us:\n${err}`);
      });
    }
  };

  /**
  * EditStudents hides the main poolPage and shows the editing page
  */

  $scope.editStudents = function() {
    $scope.editing = true;
    $scope.edited = {};
  };

  /**
  * closeEdit hides the editing page and sends the requests to the back end to edit student roles
  * closeEdit will call randomize if the student list has been updated
  */

  $scope.closeEdit = function() {
    $scope.alreadyFailed = false;
    if (!Object.keys($scope.edited).length) {
      $scope.editing = false;
      return;
    }
    if (!$scope.students.filter(stu => stu.role === "student" || stu.role === "memberAdmin").length) {
      alert("Sorry, but the pool needs to have at least one student");
      return;
    }
    $scope.lockedStus = {};
    //  $scope.randomize();
    var updatedStus = [];
    for (let i in $scope.edited) {
      let stu = $scope.studentLookupById(i);
      let index = searchForSelected(stu);
      $scope.groups[index[0]][index[1]] = {user: {name: "Rubber Duck Debugger", uid: "-100", avatar_url: '../../assets/rubberducky.png'}};
      updatedStus.push($scope.studentLookupById(i));
    }
    DB.updateRoles($routeParams.poolId, updatedStus)
    .then(() => {
      $scope.editing = false;
    })
    .catch(err => {
      console.error("Error updating roles: ", err);
      $scope.editing = false;
    });
  };

  /**
  * toggleRemoved toggles a student to the active or inactive state
  * @param {object} stu : the student being toggled
  */

  $scope.toggleRemoved = function(stu) {
    stu.role = stu.role === "student" ? "inactiveStu" :
    stu.role === "memberAdmin" ? "inactiveMA" :
    stu.role === "inactiveStu" ? "student" : "memberAdmin";
    if ($scope.edited[stu.user.uid]) {
      delete $scope.edited[stu.user.uid];
    } else {
      $scope.edited[stu.user.uid] = true;
    }
  };

  /**
  * editGrouping opens the newGrouping section and sets its data to the group to edit
  * @param {object} grouping : the grouping to edit
  */

  $scope.editGrouping = function(grouping) {
    $scope.editedGrouping = {
      title: grouping.generationData.title,
      id: grouping.generationData.id,
      pairs: grouping.pairs,
      groupSize: grouping.generationData.group_size
    };
    $scope.groupSize = grouping.generationData.group_size;
    $scope.groups = grouping.groups.map(grp => grp.map(stuId => $scope.studentLookupById(stuId)));
    $scope.groupingName = grouping.generationData.title;
    $scope.creatingGrouping = true;
    $anchorScroll('newGrouping');
  };
});
