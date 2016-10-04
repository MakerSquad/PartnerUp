angular.module('PU.createPool', ['PU.factories'])

.controller('CreatePoolController', function ($scope, MakerPass, $location, $route, $http, $window, $anchorScroll, DB, CurrentUser) {
  document.getElementById("bodyclass").className = "";
  $scope.allCohorts = [];
  $scope.isStudent = {};
  $scope.users = [];
  $scope.isAdmin = {};
  $scope.removedStus = {};
  $scope.removedAdmins = {};
  $scope.loadingPage = true;
  $scope.loadingUsers = false;

  // $scope.currentCohort = '';


  $scope.importStudents = function(){
    if(!$scope.currentCohort){
      return;
    }
    $scope.loadingUsers = true;
    MakerPass.getMemberships($scope.currentCohort)
    .then(function(members){
      var existingUsers = {};
      for(var j = 0; j < $scope.users.length; j++){
        existingUsers[$scope.users[j].user_uid] = true;
      }
      for(var i = 0; i < members.length; i++){
        var there = existingUsers[members[i].user_uid];
        if(members[i].role === 'student'){
          $scope.isStudent[members[i].user_uid] = true; 
        }
        else if(members[i].role === 'instructor' || members[i].role === 'fellow'){
          $scope.isAdmin[members[i].user_uid] = true;
        }
        if(!there){
          $scope.users.push(members[i]);
        }
      }
      $scope.loadingUsers = false;
    })
    .catch(function(err){
      console.error("Error fetching users: ", err);
      $scope.loadingUsers = false;
    })
  }


  $scope.getIndexArray = function(num){
    var arr = [];
    for(var i = 0; i < num; i++){
      arr[i] = i;
    }
    return arr;
  }

  // $scope.removeStudent = function(student){
  //   // var index = $scope.importedStudents.indexOf(student);
  //   // $scope.importedStudents.splice(index,1)
  //   removed[student.user.uid] = true;
  // }

  $scope.toggleRemoved = function(person, role){
    if(role === 'admin'){
      var removed = $scope.removedAdmins;
    }else{
      var removed = $scope.removedStus;
    }
    if(removed[person.user_uid] === undefined){
      removed[person.user_uid] = true;
    }else{
      delete removed[person.user_uid];
      $scope.noStusError = false;
    }
  }

  $scope.createPool = function(){
    $scope.loadingPage = true;
    var didError = false;
    if(!Object.keys($scope.isStudent).length){
      $scope.noStusError = true;
      didError = true;
    }
    if(!$scope.poolName.length){
      $scope.noNameError = true
      didError = true;
    }
    if(didError){
      $anchorScroll('noNameError');
      $scope.loadingPage = false;
      return; //don't go through with the create
    }

    var members=[];
    for(var i = 0; i < $scope.users.length; i++){
      var member = {};
      var userId = $scope.users[i].user_uid;
      member.user_uid = userId;
      if($scope.isStudent[userId] && $scope.isAdmin[userId]){
        member.role = "memberAdmin";
        members.push(member);
      }
      else if($scope.isStudent[userId]){
        member.role = "student";
        members.push(member);
      }
      else if($scope.isAdmin[userId]){
        member.role = $scope.users[i].role === 'student' ? 'fellow' : $scope.users[i].role;
        members.push(member);
      }
      //don't push if neither student nor admin
    }
    var groupData = {'name': $scope.poolName, 'group_size': $scope.groupSizeSelect}
    console.log('goupData', groupData)
    DB.createClass(members, groupData)
    .then(function(resp){$location.path('/pools/'+resp)})
    .catch(function(err){console.log('pool not created', err)})
  }

  $scope.toggleAdmin = function(user){
    if(user.user_uid === $scope.currentUser.uid){
      alert("You must be an admin of your own group");
      return;
    }
    if($scope.isAdmin[user.user_uid]){
      delete $scope.isAdmin[user.user_uid];
    }
    else{
      $scope.isAdmin[user.user_uid] = true;
    }
  }

  $scope.toggleStu = function(user){
    if($scope.isStudent[user.user_uid]){
      delete $scope.isStudent[user.user_uid];
    }
    else{
      $scope.isStudent[user.user_uid] = true;
    }
  }

  $scope.getRequest = function(){
    DB.getClasses().then(function(data){console.log('FUCK YEAH', data)})
    .catch(function(err){console.log('you fucked up', err)})
  }

  var init = (function(){ //function that runs on load; it'll call all the fns to set up the page
      // $scope.loading = true;
      new Clipboard('.clipyclip');
       CurrentUser.get()
       .then(function(userData){
        console.log("Userdata: ", userData);
          if(!userData){
            $location.path('/signin');
          } 
          else{
            $scope.currentUser = userData;
            //add the current user as an admin
            $scope.isAdmin[$scope.currentUser.uid] = true;
            $scope.users.push({role: 'instructor', user: $scope.currentUser, user_uid: $scope.currentUser.uid});
          }
            Promise.all([
              MakerPass.getCohorts()
            ])
            .then(function(resolveData){
              console.log("Promises resolved");
              console.log('resolveData', resolveData[0])
              var cohorts = resolveData[0].reverse(); //reverse for recency order
              for(var i = 0; i<cohorts.length; i++){
                // if(resolveData[0][i].user_role === 'instructor' || resolveData[0][i].user_role === 'fellow'){
                  $scope.allCohorts.push(cohorts[i]);
                  console.log('$scope.allCohorts', $scope.allCohorts)
                // }
              }

              console.log("Current scope: ", $scope);
              $scope.loadingPage = false;
              $scope.$apply();
            })
          
       })
       .catch(function(err){
        $location.path('/signin');
        $scope.$apply();
       })
      //})
    }())

})