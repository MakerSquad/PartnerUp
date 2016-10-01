angular.module('PU.createPool', ['PU.factories'])

.controller('CreatePoolController', function ($scope, MakerPass, $location, $route, $http, StateSaver, DB, CurrentUser) {
  document.getElementById("bodyclass").className = "";
  $scope.allCohorts = [];
  $scope.importedStudents = [];
  $scope.importedAdmins = [];

  // $scope.currentCohort = '';


  $scope.importStudents = function(){

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
})
    .catch(function(err){console.log(err)})
  }


  $scope.getIndexArray = function(num){
    var arr = [];
    for(var i = 0; i < num; i++){
      arr[i] = i;
    }
    return arr;
  }

  $scope.removeStudent = function(student){
    var index = $scope.importedStudents.indexOf(student);
    $scope.importedStudents.splice(index,1)
  }

  $scope.createPool = function(){
    var didError = false;
    if(!$scope.importedStudents.length){
      $scope.noStusError = true;
      didError = true;
    }
    if(!$scope.poolName.length){
      $scope.noNameError = true
      didError = true;
    }
    if(didError){
      return; //don't go through with the create
    }
    var members=[];
    for (var a = 0; a<$scope.importedStudents.length; a++){
      var stud = $scope.importedStudents[a]
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
    for(var i = 0; i<$scope.importedStudents.length; i++){
      var member = {};
      member.user_uid = $scope.importedStudents[i].user_uid
      member.role = $scope.importedStudents[i].role
      members.push(member);
    }
    for(var j = 0; j<$scope.importedAdmins.length;j++){
      var member = {};
      member.user_uid = $scope.importedAdmins[j].user_uid
      member.role = $scope.importedAdmins[j].role
      members.push(member);
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
      // var cookies = document.cookie;
      // console.log("Cookies: ", cookies);
      // cookies = cookies.slice(cookies.indexOf('session') + 8)
      // var session = cookies;
      // console.log("session: ", session);
      // $http({ //Check the current user; redirect if we aren't logged in
      //   method: "GET",
      //   url: "/currentUser",
      //   headers: {
      //     'token': session
      //   }
      // })
      // .then(function(resp){
       // console.log("resp", resp)
       CurrentUser.get()
       .then(function(userData){
        console.log("Userdata: ", userData);
          if(!userData){
            $location.path('/signin');
          } 
          else{
            $scope.currentUser = userData;
            // var savedState = StateSaver.restoreState(); //if we previously saved state, grab it back
            // if(savedState){
            //   $scope = Object.assign($scope, savedState); //copy the saved state back into scope
            //   if(savedState.edited){
            //     $route.reload()
            //   }
            }
            Promise.all([
              MakerPass.getCohorts()
            ])
            .then(function(resolveData){
              console.log("Promises resolved");
              console.log('resolveData', resolveData[0])
              for(var i = 0; i<resolveData[0].length; i++){
                // if(resolveData[0][i].user_role === 'instructor' || resolveData[0][i].user_role === 'fellow'){
                  $scope.allCohorts.push(resolveData[0][i]);
                  console.log('$scope.allCohorts', $scope.allCohorts)
                // }
              }

              console.log("Current scope: ", $scope);
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