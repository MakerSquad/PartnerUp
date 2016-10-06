angular.module('PU.signin', [

])

.controller('AuthController', function ($scope, $window, $location, $http, CurrentUser) {
  document.getElementById("bodyclass").className = "bodyclass";
  $scope.user = {};

  /*
  * If the user is already signed in, redirect to home
  */
  CurrentUser.get()
  .then((userData) => {
    $location.path('/');
    $scope.$apply();
  })
  .catch(() => {})

  /**
  * Function to path to the demo
  */

  $scope.startDemo = function(){
    $location.path('/demo');
  }

  /**
  * LoginMakerPass redirects the user to the Makerpass OAuth for login via a pop up
  */
  
  $scope.loginMakerPass = function(){
    // $window.location.href = '/auth/makerpass';
    $.oauthpopup = function(options) {
      options.windowName = options.windowName ||  'ConnectWithOAuth'; // should not include space for IE
      options.windowOptions = options.windowOptions || 'location=0,status=0,width=800,height=400';
      options.callback = options.callback || function(){ window.location.reload(); };
      var that = this;
      that._oauthWindow = window.open(options.path, options.windowName, options.windowOptions);
      that._oauthInterval = window.setInterval(function(){
        try{
          var x = that._oauthWindow.document.body.innerHTML
          options.callback(that._oauthWindow.document.body.innerHTML);
          window.clearInterval(that._oauthInterval);
          that._oauthWindow.close()
        }
        catch (e){
          if (!e instanceof DOMException) {
            console.log("error even:", e);
          }
        }
      }, 1000);
    };

    $.oauthpopup({windowName: 'login', path:'/auth/makerpass', callback: function (data){
      console.log("data in callback", data);
      var signInInfo = JSON.parse(data.slice(data.indexOf('{'), data.lastIndexOf('}') + 1));
      if(!signInInfo.token){
        alert("Whoops! Something went wrong with your log in. Please try again, I promise we'll (try to) do better");
        return;
      }
      document.cookie = `token=${signInInfo.token}`;
      //CurrentUser.set(signInInfo.data.user);
      $window.location.href = ('/#/');
  }})
  }

});




