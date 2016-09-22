angular.module('PU.history', ['PU.factories'])

.controller('HistoryController', function ($scope, $location, Makerpass, $http, $routeParams, DB) {
  
  // //set up for copy to clipboard function 
  new Clipboard('.clipyclip');
  $scope.groupSize = 2
  $scope.generationId = 0; 
  $scope.pastPairs = [];
  $scope.generations = [];
  $scope.prev='prev'
  $scope.nex= 'next'
  $scope.currGen = 0
  $scope.maxGen = 0
  $scope.currClass = $routeParams.class //CURRENT CLASS ID!
  $scope.badPartners = []
  $scope.index = 0
  $scope.library = {};

  //*********************************************************************************
  //this will get all the past pairs from the database by class id and generation id
  //*********************************************************************************
  $scope.getGen = function(cls){
  return   DB.getGenerations($scope.currClass)
    .then(function(data){
      console.log(data)
      for(var i = 0; i<data.length; i++){
        $scope.generations.push(data[i])
      }
      console.log('dddddddd', $scope.generations)
      $scope.currGen = $scope.generations[0].title
      $scope.maxGen = $scope.generations.length-1
      $scope.generationId = $scope.generations[0].id
      console.log('fdfdfd',$scope.generationId)
      if($scope.generations.length > 1){
      $scope.prev=$scope.generations[$scope.generations.length-1].title
      $scope.nex= $scope.generations[1].title
    }
    

  })
  }

  $scope.getHistory = function(classId){
    //database function to get all data
   return DB.getPairs($scope.currClass)
      .then(function(data){
        console.log('hihihi: ',data)
        $scope.pastPairs = data
        $scope.pastPairs = $scope.pastPairs.filter(m=>m.gen_table_id===$scope.generationId)
        console.log('lalala: ',$scope.pastPairs)
        
      })

  }
   
   $scope.makeMap = function (){
    return DB.getMemberships($scope.currClass)
    .then(function(data){console.log('flaflafla', data[0].user)
      for (var i = 0; i<data.length; i++){
        console.log(data[i].user)
        $scope.library[data[i].user.uid]= data[i].user.name
      }
  })

   }


  // *********************************************************************************
  // this sets the generation and sets the next and previous generations so that they
  // go in orders (asc). this allows you to click on the generation title in the html
  // and set that to the current generation.
  // *********************************************************************************

  $scope.setGen = function(generation){
    $scope.currGen = generation.title;
    $scope.groupSize = generation.group_size;
    $scope.index = $scope.generations.indexOf(generation)
    $scope.generationId = $scope.generations[$scope.index].id
    if($scope.index === 0){
      $scope.nex = $scope.generations[$scope.index+1].title
      $scope.prev = $scope.generations[$scope.generations.length-1].title
    }
    else if($scope.index === $scope.maxGen){
      $scope.prev = $scope.generations[$scope.index-1].title
      $scope.nex = $scope.generations[0].title
    }
    else{
      console.log("$scope.index: ", $scope.index);
      $scope.prev = $scope.generations[$scope.index-1].title
      $scope.nex = $scope.generations[$scope.index+1].title
    }

    $scope.getHistory($scope.currClass, $scope.generations[$scope.index].id);

  }

  //*********************************************************************************
  //When the next button is clicked, this sets the current generation to the next 
  //generation and sets the prev and next generations and then calls get history to 
  //get the history of the current generation
  //*********************************************************************************

  $scope.next = function(){
    if($scope.generations.length > 1){
    if($scope.index >= $scope.maxGen){
      $scope.index = 0;
      $scope.prev=$scope.generations[($scope.generations.length-1)].title
      $scope.currGen = $scope.generations[$scope.index].title
      $scope.nex= $scope.generations[$scope.index+1].title
      $scope.generationId = $scope.generations[$scope.index].id
    }

    else{
      $scope.index++;
      $scope.currGen = $scope.generations[($scope.index)].title
      $scope.prev=$scope.generations[($scope.index-1)].title
      $scope.generationId = $scope.generations[$scope.index].id
      if($scope.index === $scope.maxGen){
        $scope.nex = $scope.generations[0].title;
      }
      else{
        $scope.nex= $scope.generations[$scope.index+1].title
      }
    }

    $scope.getHistory($routeParams.class, $scope.generations[$scope.index].id);
  }
}
  //*********************************************************************************
  //When the preious button is clicked, this sets the current generation to the previous 
  //generation and sets the prev and next generations and then calls get history to 
  //get the history of the current generation
  //*********************************************************************************
  $scope.previous = function(){
    if($scope.generations.length > 1){
    if($scope.index>=1){
    $scope.index--
    $scope.currGen = $scope.generations[($scope.index)].title
    $scope.nex= $scope.generations[$scope.index+1].title
    $scope.generationId = $scope.generations[$scope.index].id
      if($scope.index=== 0){
        $scope.prev = $scope.generations[($scope.maxGen)].title
      }
      else{
        $scope.prev=$scope.generations[($scope.index-1)].title
      }
    }
    else if($scope.index <= 0){
      $scope.index = $scope.maxGen
      $scope.currGen = $scope.generations[($scope.index)].title
      $scope.nex= $scope.generations[0].title
      $scope.prev=$scope.generations[($scope.generations.length-2)].title
      $scope.generationId = $scope.generations[$scope.index].id
    }
    $scope.getHistory($routeParams.class, $scope.generations[$scope.index].id);
  }
}

  $scope.toggleBadPartners = function(pair){
    console.log(pair)
      $scope.badPartners.push(pair);
    
      console.log($scope.badPartners)
    }

  

    $scope.getIndexArray = function(num){
    var arr = [];
    for(var i = 0; i < num; i++){
      arr[i] = i;
    }
    return arr;
  }
  //*********************************************************************************
  //takes you back to the homepage when homepage button is clicked 
  //*********************************************************************************

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
        $scope.getGen()
        .then(function(stuff){$scope.getHistory()
          .then(function(morestuff){$scope.makeMap()
            .then(function(evenmorestuff){console.log('init complete')})
          })
        })
        
      
    })
  }())

  
})
