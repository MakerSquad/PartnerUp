angular.module('PU.createPool', ['PU.factories'])

.controller('CreatePoolController', function($scope, MakerPass, $location, $route, $http, $window, $anchorScroll, DB, CurrentUser) {
  $scope.allCohorts = [];
  $scope.isStudent = {};
  $scope.users = [];
  $scope.isAdmin = {};
  $scope.removedStus = {};
  $scope.removedAdmins = {};
  $scope.loadingPage = true;
  $scope.loadingUsers = false;
  $scope.error = "";

  $scope.numKeys = Object.keys;

// ******************************************************************************
// This imports all the MakerPass members and separates them to two sub groups:
// admins and members. If the makerPass member is not found in the group it will
// add them. It is possible to be both an admin and a member
// ******************************************************************************

  $scope.importStudents = function() {
    if (!$scope.currentCohort) {
      return;
    }
    $scope.loadingUsers = true;
    MakerPass.getMemberships($scope.currentCohort)
    .then(function(members) {
      var existingUsers = {};
      for (var j = 0; j < $scope.users.length; j++) {
        existingUsers[$scope.users[j].user_uid] = true;
      }
      for (var i = 0; i < members.length; i++) {
        var there = existingUsers[members[i].user_uid];
        if (members[i].role === 'student') {
          $scope.isStudent[members[i].user_uid] = true;
        } else if (members[i].role === 'instructor' || members[i].role === 'fellow') {
          $scope.isAdmin[members[i].user_uid] = true;
        }
        if (!there) {
          $scope.users.push(members[i]);
        }
      }
      $scope.loadingUsers = false;
    })
    .catch(function(err) {
      console.error("Error fetching users: ", err);
      $scope.loadingUsers = false;
    });
  };

  $scope.goHome = function() {
    $location.path('/');
  };

// ******************************************************************************
// This allows the group size to be selected. The max group size can be changed
// in the HTML but raising the num.
// ******************************************************************************

  $scope.getIndexArray = function(num) {
    var arr = [];
    for (var i = 0; i < num; i++) {
      arr[i] = i;
    }
    return arr;
  };


// ******************************************************************************
// This creates the pools. it has error catching for no title or no members. It
// automatically makes the creator an admin. This also adds the pool to the database
// ******************************************************************************

  $scope.createPool = function() {
    $scope.loadingPage = true;
    var didError = false;
    if (!Object.keys($scope.isStudent).length) {
      $scope.noStusError = true;
      didError = true;
    }
    if (!$scope.poolName.length) {
      $scope.noNameError = true;
      didError = true;
    }
    if (didError) {
      $anchorScroll('noNameError');
      $scope.loadingPage = false;
      return; // don't go through with the create
    }

    var members = [];
    for (var i = 0; i < $scope.users.length; i++) {
      var member = {};
      var userId = $scope.users[i].user_uid;
      member.user_uid = userId;
      if ($scope.isStudent[userId] && $scope.isAdmin[userId]) {
        member.role = "memberAdmin";
        members.push(member);
      } else if ($scope.isStudent[userId]) {
        member.role = "student";
        members.push(member);
      } else if ($scope.isAdmin[userId]) {
        member.role = $scope.users[i].role === 'student' ? 'fellow' : $scope.users[i].role;
        members.push(member);
      }
      // don't push if neither student nor admin
    }
    var groupData = {'name': $scope.poolName, 'group_size': $scope.groupSizeSelect};
    DB.createClass(members, groupData)
    .then(function(resp) {
      $location.path('/pools/' + resp);
    })
    .catch(function(err) {
      $scope.error = err;
      $scope.loadingPage = false;
    });
  };

// ******************************************************************************
// This allows you to toggle between being an admin and not an admin except the
// creator of the group MUST be an admin of their own group.
// ******************************************************************************

  $scope.toggleAdmin = function(user) {
    if (user.user_uid === $scope.currentUser.uid) {
      alert("You must be an admin of your own group");
      return "You must be an admin of your own group";
    }
    if ($scope.isAdmin[user.user_uid]) {
      delete $scope.isAdmin[user.user_uid];
    } else {
      $scope.isAdmin[user.user_uid] = true;
    }
  };

// ******************************************************************************
// This allows you to toggle between being a member or not a member. You do not
// have to be a member in the group you created.
// ******************************************************************************

  $scope.toggleStu = function(user) {
    if ($scope.isStudent[user.user_uid]) {
      delete $scope.isStudent[user.user_uid];
    } else {
      $scope.isStudent[user.user_uid] = true;
    }
  };

// ******************************************************************************
// This intializes the page. It gets all the groups that the signed in user is
// apart of and sets them to be an admin. It also has catches for if a non-logged
// in user tries to access the page.
// ******************************************************************************

  var init = (function() { // function that runs on load; it'll call all the fns to set up the page
    // $scope.loading = true;
    CurrentUser.get()
    .then(function(userData) {
      if (!userData) {
        $location.path('/signin');
      } else {
        $scope.currentUser = userData;
        DB.canCreate($scope.currentUser)
        .then(function(canCreate) {
          if (!canCreate) {
            $scope.cantCreateError = true;
            $scope.loadingPage = false;
            return;
          } else {
            // add the current user as an admin
            $scope.isAdmin[$scope.currentUser.uid] = true;
            $scope.users.push({role: 'instructor', user: $scope.currentUser, user_uid: $scope.currentUser.uid});
            Promise.all([
              MakerPass.getCohorts()
            ])
            .then(function(resolveData) {
              var cohorts = resolveData[0].reverse(); // reverse for most recent order
              for (var i = 0; i < cohorts.length; i++) {
                $scope.allCohorts.push(cohorts[i]);
              }
              $scope.loadingPage = false;
              $scope.$apply();
            });
          }
        });
      }
    })
    .catch(function(err) {
      $location.path('/signin');
      $scope.$apply();
      console.log(err);
    });
  })();
});
