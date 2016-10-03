angular.module('PU.createPool', ['PU.factories'])

.controller('CreatePoolController', function ($scope, MakerPass, $location, $route, $http, $window, $anchorScroll, DB, CurrentUser) {
  document.getElementById("bodyclass").className = "";
  $scope.allCohorts = [];
  $scope.importedStudents = [];
  $scope.importedAdmins = [];
  $scope.removedStus = {};
  $scope.removedAdmins = {};
  $scope.loadingPage = true;
  $scope.loadingUsers = false;

  // $scope.currentCohort = '';


  $scope.importStudents = function(){
    $scope.loadingUsers = true;
    MakerPass.getMemberships($scope.currentCohort)
    .then(function(data){
      console.log('data', data)
      for(var i = 0; i<data.length; i++){
        if(data[i].role === 'student'){
          var there = false
          for(var j = 0; j<$scope.importedStudents.length;j++){
            if(data[i].user_uid === $scope.importedStudents[j].user_uid){
              there = true
            }
          }
          if(there === false){
            $scope.importedStudents.push(data[i])
          }
        }
        $scope.noStusError = false;
    
        if(data[i].role === 'fellow' || data[i].role === 'instructor'){
          var isThere = false
          for(var k = 0; k<$scope.importedAdmins.length; k++){
            console.log('yeah budddddy')
            if(data[i].user_uid === $scope.importedAdmins[k].user_uid){
            console.log('its there already doofus')
            isThere = true
            }
          }
          if(isThere === false){
            $scope.importedAdmins.push(data[i]);
          }
          console.log('admins!', $scope.importedAdmins)
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
    if(!$scope.importedStudents.length || $scope.importedStudents.length === Object.keys($scope.removedStus).length){
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
    for (var a = 0; a<$scope.importedStudents.length; a++){
      var stud = $scope.importedStudents[a]
      if(!$scope.removedStus[stud.user_uid]){
        for (var b=0; b<$scope.importedAdmins.length;b++){
          var admin = $scope.importedAdmins[b]
          if(stud.user_uid === admin.user_uid){
            var member = {};
            member.user_uid = stud.user_uid;
            member.role = "memberAdmin";
            members.push(member);
            var index = $scope.importedStudents.indexOf(stud)
            $scope.importedStudents.splice(index, 1)
            var index2 = $scope.importedAdmins.indexOf(admin)
            $scope.importedAdmins.splice(index2, 1)
          }
        }
      }
    }
    for(var i = 0; i<$scope.importedStudents.length; i++){
      var member = {};
      member.user_uid = $scope.importedStudents[i].user_uid
      member.role = $scope.importedStudents[i].role
      if(!$scope.removedStus[member.user_uid]){
        members.push(member);
      }
    }
    for(var j = 0; j<$scope.importedAdmins.length;j++){
      var member = {};
      member.user_uid = $scope.importedAdmins[j].user_uid
      member.role = $scope.importedAdmins[j].role
      if(!$scope.removedAdmins[member.user_uid]){
        members.push(member);
      }
    }
    console.log('members', members)
    var groupData = {'name': $scope.poolName, 'group_size': $scope.groupSizeSelect}
    console.log('goupData', groupData)
    DB.createClass(members, groupData)
    .then(function(resp){$location.path('/pools/'+resp)})
    .catch(function(err){console.log('pool not created', err)})

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
            $scope.importedAdmins.push({role: 'instructor', user: $scope.currentUser, user_uid: $scope.currentUser.uid});
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