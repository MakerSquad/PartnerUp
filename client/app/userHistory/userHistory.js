angular.module('PU.userHistory', [])

.controller("UserHistoryController", function($scope, CurrentUser, $location, DB, $routeParams) {
  $scope.currentUser = {};
  $scope.error = "";
  $scope.pools = []; // [{title: String, generations: [{title: String, group: [users]}]}]
  $scope.user = null; // must be initially set to null

  var init = (function() {
    $scope.loading = true;
    CurrentUser.get()
    .then(function(userData) {
      if (/-\d?\d?\d?/.test($routeParams.userUid)) { // a duck's history
        $scope.error = "A duck's history is a great secret. Don't be nosy";
        $scope.loading = false;
        return;
      }
      $scope.currentUser = userData;
      DB.getUserHistory($routeParams.userUid)
      .then(function(history) {
        createGroupings(history);
        $scope.loading = false;
      })
      .catch(function(err) {
        $scope.error = "Looks like there was an error getting the history for this user (Make sure they exist)";
        $scope.loading = false;
      });
    })
    .catch(function(err) {
      console.error("Error getting user info: ", err);
      $location.path("/signin");
      $scope.$apply();
    });
  })();

  var createGroupings = function(hist) {
    var poolsSeen = {};
    var poolMap = {};
    var genMap = {};

    hist.forEach(function(pair) {
      if (poolsSeen[pair.group.id] === undefined) {
        poolsSeen[pair.group.id] = {};
        poolMap[pair.group.id] = pair.group;
        genMap[pair.group.id] = {};
      }
      var currPool = poolsSeen[pair.group.id];
      if (currPool[pair.generations.id] === undefined) {
        genMap[pair.group.id][pair.generations.id] = pair.generations;
        currPool[pair.generations.id] = [];
      }
      var currGen = currPool[pair.generations.id];
      if (!pair.user1) {
        currGen.push({name: "Rubber Duck Debugger", uid: "-1", avatar_url: "../../assets/rubberducky.png"});
      } else if (!pair.user2) {
        currGen.push({name: "Rubber Duck Debugger", uid: "-1", avatar_url: "../../assets/rubberducky.png"});
      } else if (pair.user1.uid !== $routeParams.userUid) {
        currGen.push(pair.user1);
        if (!$scope.user) {
          $scope.user = pair.user2;
        }
      } else {
        currGen.push(pair.user2);
        if (!$scope.user) {
          $scope.user = pair.user1;
        }
      }
    });

    for (var p in poolsSeen) {
      var gens = [];
      for (var g in poolsSeen[p]) {
        gens.push({title: genMap[p][g].title, group: poolsSeen[p][g]});
      }
      $scope.pools.push({title: poolMap[p].name, generations: gens});
    }
  };

  $scope.filterPools = function(pool) {
    return $scope.searchPools ?
      pool.title.toLowerCase().includes($scope.searchPools.toLowerCase()) :
      true;
  };

  $scope.filterGens = function(gen) {
    return $scope.filterGensByName(gen) && $scope.filterGensForStu(gen);
  };

  $scope.filterGensByName = function(gen) {
    return $scope.searchGens ?
      gen.title.toLowerCase().includes($scope.searchGens.toLowerCase()) :
      true;
  };

  $scope.filterGensForStu = function(gen) {
    return $scope.searchStus ? gen.group.filter(
      stu => stu.name.toLowerCase().includes($scope.searchStus.toLowerCase())).length :
      true;
  };

  $scope.switchUser = function(user) {
    $location.path(`/users/${user.uid}`);
  };
});
