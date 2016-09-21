angular.module('PU.history', ['PU.factories'])

.controller('HistoryController', function ($scope, $location, Makerpass, $http, $routeParams) {
  
  // //set up for copy to clipboard function 
  // new Clipboard('.clipyclip');
  // $scope.groupSize = 2
  $scope.generationId = 1; 
  $scope.pastPairs = [];
  $scope.generations = [];
  // $scope.prev=$scope.generations[($scope.generations.length-1)].title
  // $scope.nex= $scope.generations[1].title
  // $scope.currGen = $scope.generations[0].title
  // $scope.maxGen = $scope.generations.length
  $scope.currClass = $routeParams.class //CURRENT CLASS ID!
  // $scope.badPartners = []

  //*********************************************************************************
  //this will get all the past pairs from the database by class id and generation id
  //*********************************************************************************

  $scope.getHistory = function(classId, generationId){
    //database function to get all data
    $http({
      method: 'GET',
      url: `/database/${$routeParams.class}/pairs`
    }).then(function(data){
      console.log('hey hey hey',data.data)
    $scope.pastPairs = data.data
  })
  }

  $scope.getHistory();

  //*********************************************************************************
  //this sets the generation and sets the next and previous generations so that they
  //go in orders (asc). this allows you to click on the generation title in the html
  //and set that to the current generation.
  //*********************************************************************************

  // $scope.setGen = function(generation){
  //   $scope.currGen = generation.title;
  //   $scope.generationId = $scope.generations.indexOf(generation)+1
  //   if($scope.generationId === 1){
  //     $scope.nex = $scope.generations[$scope.generationId].title
  //     $scope.prev = $scope.generations[$scope.generations.length-1].title
  //   }
  //   else if($scope.generationId === $scope.maxGen){
  //     $scope.prev = $scope.generations[$scope.generationId-2].title
  //     $scope.nex = $scope.generations[0].title
  //   }
  //   else{
  //     $scope.prev = $scope.generations[$scope.generationId-2].title
  //     $scope.nex = $scope.generations[$scope.generationId].title
  //   }

  //   $scope.getHistory($scope.currClass, $scope.generationId);

  // }

  // //*********************************************************************************
  // //When the next button is clicked, this sets the current generation to the next 
  // //generation and sets the prev and next generations and then calls get history to 
  // //get the history of the current generation
  // //*********************************************************************************

  // $scope.next = function(){

  //   if($scope.generationId >= $scope.maxGen){
  //     $scope.generationId = 1;
  //     $scope.prev=$scope.generations[($scope.generations.length-1)].title
  //     $scope.currGen = $scope.generations[($scope.generationId-1)].title
  //     $scope.nex= $scope.generations[$scope.generationId].title
  //   }

  //   else{
  //     $scope.generationId++;
  //     $scope.currGen = $scope.generations[($scope.generationId-1)].title
  //     $scope.prev=$scope.generations[($scope.generationId-2)].title
  //     if($scope.generationId === $scope.generations.length){
  //       $scope.nex = $scope.generations[0].title;
  //     }
  //     else{
  //       $scope.nex= $scope.generations[$scope.generationId].title
  //     }
  //   }

  //   $scope.getHistory($routeParams.class, $scope.generationId);
  // }
  // //*********************************************************************************
  // //When the preious button is clicked, this sets the current generation to the previous 
  // //generation and sets the prev and next generations and then calls get history to 
  // //get the history of the current generation
  // //*********************************************************************************
  // $scope.previous = function(){
    
  //   if($scope.generationId>=2){
  //   $scope.generationId--
  //   $scope.currGen = $scope.generations[($scope.generationId-1)].title
  //   $scope.nex= $scope.generations[$scope.generationId].title
  //     if($scope.generationId === 1){
  //       $scope.prev = $scope.generations[($scope.maxGen-1)].title
  //     }
  //     else{
  //       $scope.prev=$scope.generations[($scope.generationId-2)].title
  //     }
  //   }
  //   else if($scope.generationId <= 1){
  //     $scope.generationId = $scope.maxGen
  //     $scope.currGen = $scope.generations[($scope.generationId-1)].title
  //     $scope.nex= $scope.generations[0].title
  //     $scope.prev=$scope.generations[($scope.generations.length-2)].title
  //   }
  //   $scope.getHistory($routeParams.class, $scope.generationId);
  // }

  // $scope.toggleBadPartners = function(pair){
  //   console.log(pair)
  //     $scope.badPartners.push(pair);
    
  //     console.log($scope.badPartners)
  //   }

  

  //   $scope.getIndexArray = function(num){
  //   var arr = [];
  //   for(var i = 0; i < num; i++){
  //     arr[i] = i;
  //   }
  //   return arr;
  // }

  // //*********************************************************************************
  // //takes you back to the homepage when homepage button is clicked 
  // //*********************************************************************************

  $scope.goHome = function(){
    $location.path('/');
  }

  var init = (function(){ //function that runs on load; it'll call all the fns to set up the page
    
    
    $http({ //Check the current user; redirect if we aren't logged in
      method: "GET",
      url: "/currentUser"
    })
    .then(function(resp){
      if(resp.data === ""){
        $location.path('/signin');
      } 
     
      
    })
  }())

  
})
