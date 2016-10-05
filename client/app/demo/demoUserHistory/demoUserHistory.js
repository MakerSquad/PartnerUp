angular.module('PU.demoUserHistory', [])

.controller("DemoUserHistoryController", function($scope, CurrentUser, $location, DB, $routeParams){
  $scope.currentUser = {};
  var allHistory = [];
  $scope.error = "";
  $scope.pools = []; //[{title: String, generations: [{title: String, group: [users]}]}]
  $scope.user;

  var demoGetUserHistory = function(userUid){
    var pairingData = window.pastGroupings.map(function(pool){
      return pool.map(function(generation){        
        return {
          generationData: generation.generationData,
          pairs: generation.pairs.filter(function(pair){
            return pair.user1_uid === userUid || pair.user2_uid === userUid;
          })
        }
      })
    });

    var userHist = [];
    pairingData.forEach(function(pool){
      return pool.map(function(generation){
        userHist = userHist.concat(generation.pairs.map(function(pair){
          return {
          generations: generation.generationData,
          group: window.pools[generation.generationData.group_id -1],
          user1: window.demoUsersById[pair.user1_uid].user,
          user2: window.demoUsersById[pair.user2_uid].user
        }}))
      })
    })
    return userHist
  }

  var createGroupings = function(hist){
    var poolsSeen = {};
    var poolMap = {};
    var genMap = {};

    hist.forEach(function(pair){
      if(poolsSeen[pair.group.id] === undefined){
        poolsSeen[pair.group.id] = {};
        poolMap[pair.group.id] = pair.group;
        genMap[pair.group.id] = {};
      }
      var currPool = poolsSeen[pair.group.id];
      if(currPool[pair.generations.id] === undefined){
        genMap[pair.group.id][pair.generations.id] = pair.generations;
        currPool[pair.generations.id] = [];
      }
      var currGen = currPool[pair.generations.id];
      if(!pair.user1){
        currGen.push({name: "Rubber Duck Debugger", uid: "-1", avatar_url: "https://i.vimeocdn.com/portrait/58832_300x300"});
      }else if(!pair.user2){
        currGen.push({name: "Rubber Duck Debugger", uid: "-1", avatar_url: "https://i.vimeocdn.com/portrait/58832_300x300"});
      }else if(pair.user1.uid !== $routeParams.userUid){
        currGen.push(pair.user1);
        if(!$scope.user){
          $scope.user = pair.user2;
        }
      }else{
        currGen.push(pair.user2);
        if(!$scope.user){
          $scope.user = pair.user1;
        }
      }
    })

    for(var p in poolsSeen){
      var gens = [];
      for(var g in poolsSeen[p]){
        gens.push({title: genMap[p][g].title, group: poolsSeen[p][g]});
      }
      $scope.pools.push({title: poolMap[p].name, generations: gens});
      console.log("$scope.pools: ", $scope.pools);
    }
  }

  $scope.filterPools = function(pool){
    return $scope.searchPools ? 
      pool.title.toLowerCase().includes($scope.searchPools.toLowerCase()) :
      true;
  }

  $scope.filterGens = function(gen){
    return $scope.filterGensByName(gen) && $scope.filterGensForStu(gen);
  }
  $scope.filterGensByName = function(gen){
    return $scope.searchGens ? 
      gen.title.toLowerCase().includes($scope.searchGens.toLowerCase()) :
      true;
  }

  $scope.filterGensForStu = function(gen){
    return $scope.searchStus ? gen.group.filter(
      stu => stu.name.toLowerCase().includes($scope.searchStus.toLowerCase())).length :
      true;
  }

  var init = (function(){
    new Clipboard('.clipyclip');
    if(!window.currentUser){
      $location.path('/demo');
      return;      
    }
    $scope.loading = true;
      if(/-\d?\d?\d?/.test($routeParams.userUid)){ //a duck's history
        $scope.error = "A duck's history is a great secret. Don't be nosy";
        $scope.loading = false;
        return;
      }
      $scope.currentUser = window.currentUser;
      var history = demoGetUserHistory($routeParams.userUid);
      allHistory = history;
      console.log("History: ", history);
      createGroupings(history);
      $scope.loading = false;
      console.log("Scope: ", $scope);
  }())
})