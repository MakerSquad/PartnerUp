angular.module('PU.home', ['PU.factories'])

.controller('HomeController', function($scope, MakerPass, $location, $route, $http, DB, CurrentUser) {
  $scope.currentUser = {}; // where we store the current user's information
  $scope.pools = []; // where  we store the total amout of pools from the owner
  $scope.loading = true; // states whether the page is loading or not. used for loading gif.

  // ******************************************************************************
  // This shows all the pools that the user belongs too
  // ******************************************************************************

  $scope.showPools = function() {
    return DB.getClasses()
    .then(function(data) {
      $scope.pools = data.reverse(); // shows pools in more recent order first
    })
    .catch(function(err) {
      console.log('showPools err', err);
    });
  };

  // ******************************************************************************
  // This allows you to go to the create pool page
  // ******************************************************************************

  $scope.goToCreatePool = function() {
    $location.path('/createPool');
  };

  // ******************************************************************************
  // This makes pools clickable so you can go to their specific pool page
  // ******************************************************************************

  $scope.goToPool = function(pool) {
    $location.path(`/pools/${pool.id}`);
  };

  // ******************************************************************************
  // This allows you to delete entire pools, only if you are the admin of the pool
  // it does give you a warning incase of accidentally clicking.
  // ******************************************************************************

  $scope.deletePool = function(pool) {
    // precautionary if statement to make sure a student may not delete a pool.
    if (pool.role === 'fellow' || pool.role === 'instructor' || pool.role === 'memberAdmin') {
      // confirms that you want to delete the pool. pressing cancel will cancel the event
      if (confirm('Do you want to delete this pool, once delete its gone forever?')) {
        DB.deletePool(pool.id)
        .then(function(resp) {
          $route.reload(); // the page needs to update with the delete pool gone
        })
        .catch(function(err) {
          console.log(err);
        });
      }
    } else {
      // says why you may not delete this pool
      alert("you are not an admin, you may not delete this pool");
    }
  };

  // ******************************************************************************
  // This initalizes the page and sets the signed in user to the current user. It
  // also calls show pools so all the pools may be displayed on the page.
  // ******************************************************************************

  var init = (function() { // function that runs on load; it'll call all the fns to set up the page
    // this is our copy button code. its makes copying so easy. clipboard.js!
    new Clipboard('.clipyclip');
    $scope.loading = true; // sets loading to true so the gif can come into play
    CurrentUser.get() // gets all user data
    .then(function(userData) {
      if (!userData) {
        $location.path('/signin'); // whoops you aren't signed in! so its redirects you to sign in
      } else {
        $scope.currentUser = userData; // sets the user data to the current user
        Promise.all([
          $scope.showPools() // promises that showPools will finish
        ])
        .then(function(resolveData) {
          $scope.loading = false; // sets loading to false. no more loading gif.
          $scope.$apply(); // applies all the changes to the page
        });
      }
    })
    .catch(function(err) {
      $location.path('/signin'); // is this fails send them back to login
      $scope.$apply();
      console.log(err);
    });
  })();
});
