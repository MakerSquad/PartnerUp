angular.module('PU.createPool', ['PU.factories'])

.controller('CreatePoolController', function ($scope, MakerPass, $location, $route, $http, StateSaver, DB, CurrentUser) {
  $scope.allCohorts = [];
  $scope.importedStudents = [];
  // $scope.currentCohort = '';


  $scope.importStudents = function(){
    MakerPass.getMemberships($scope.currentCohort)
    .then(function(data){
      console.log('data', data)
      for(var i = 0; i<data.length; i++){
      if(data[i].role === 'student'){
      $scope.importedStudents.push(data[i])
    }
  }
  console.log('$scope.importedStudents',$scope.importedStudents)
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
    console.log('yo',$scope.importedStudents)
      var members=[];
    for(var i = 0; i<$scope.importedStudents.length; i++){
      console.log('four loop made it')
      var member = {};
      member.user_uid = $scope.importedStudents[i].user.user_uid
      member.role = $scope.importedStudents[i].role
      console.log('dadada',member)
      members.push(member);
    }
    console.log('members', members)
    var groupData = {'name': $scope.poolName, 'mksId': $scope.importedStudents[0].group_uid }
    console.log('goupData', groupData)
    DB.createClass(members, groupData)
    .then(function(resp){console.log('pool created')})
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
                if(resolveData[0][i].user_role === 'instructor' || resolveData[0][i].user_role === 'fellow'){
                  $scope.allCohorts.push(resolveData[0][i]);
                  console.log('$scope.allCohorts', $scope.allCohorts)
                }
              }
              // if()

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