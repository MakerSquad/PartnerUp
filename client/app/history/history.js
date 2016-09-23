angular.module('PU.history', ['PU.factories'])

.controller('HistoryController', function ($scope, $location, Makerpass, $http, $routeParams, DB, StateSaver) {
  
  new Clipboard('.clipyclip');
  $scope.groupSize = 2;
  $scope.generationId = 0; 
  $scope.pastPairs = [];
  $scope.displayPairs = [];
  $scope.generations = [];
  $scope.prev='prev';
  $scope.nex= 'next';
  $scope.currGen = 0;
  $scope.maxGen = 0;
  $scope.currClass = $routeParams.class; //CURRENT CLASS ID!
  $scope.badPartners = [];
  $scope.index = 0;
  $scope.library = {};
  $scope.currClassName = ''

  //*********************************************************************************
  //this will get all the past pairs from the database by class id and generation id
  //*********************************************************************************

  $scope.getGen = function(cls){
  return   DB.getGenerations($scope.currClass)
    .then(function(data){
      for(var i = 0; i<data.length; i++){
        $scope.generations.push(data[i]);
      }
      
      $scope.currGen = $scope.generations[0].title;
      $scope.maxGen = $scope.generations.length-1;
      $scope.generationId = $scope.generations[0].id;
      if($scope.generations.length > 1){
        $scope.prev=$scope.generations[$scope.generations.length-1].title;
        $scope.nex= $scope.generations[1].title;
      }
    });
  };

  //*********************************************************************************
  //calls the database and sets pastpairs to the data we get back
  //*********************************************************************************

  $scope.getHistory = function(){
    //database function to get all data
   return DB.getPairs($scope.currClass)
      .then(function(data){
        $scope.pastPairs = data;
      });
  };

  //*********************************************************************************
  //filters the data with the current generationId
  //*********************************************************************************

  $scope.changeGen = function(){
    $scope.displayPairs = $scope.pastPairs.filter(pp => pp.gen_table_id===$scope.generationId);
  };

  //*********************************************************************************
  //makes a library with names and uids so names will show up on the page and not the 
  //uids
  //*********************************************************************************
   
   $scope.makeMap = function (){
    return DB.getMemberships($scope.currClass)
    .then(function(data){
      for (var i = 0; i<data.length; i++){
        $scope.library[data[i].user.uid]= data[i].user.name;
      }
    });
   }

  //*********************************************************************************
  //gets class name by giving the class's uid
  //*********************************************************************************
    $scope.getName = function(){
      var states = StateSaver.checkState();
      $scope.currClassName = states.currentClass.name
      console.log('STATES STATES', $scope.currClassName)
    }

  // *********************************************************************************
  // this sets the generation and sets the next and previous generations so that they
  // go in orders (asc). this allows you to click on the generation title in the html
  // and set that to the current generation.
  // *********************************************************************************

  $scope.setGen = function(generation){
    $scope.currGen = generation.title;
    $scope.groupSize = generation.group_size;
    $scope.index = $scope.generations.indexOf(generation);
    $scope.generationId = $scope.generations[$scope.index].id;
    if($scope.index === 0){
      $scope.nex = $scope.generations[$scope.index+1].title;
      $scope.prev = $scope.generations[$scope.generations.length-1].title;
    }
    else if($scope.index === $scope.maxGen){
      $scope.prev = $scope.generations[$scope.index-1].title;
      $scope.nex = $scope.generations[0].title;
    }
    else{
      $scope.prev = $scope.generations[$scope.index-1].title;
      $scope.nex = $scope.generations[$scope.index+1].title;
    }
    $scope.changeGen();
  };

  //*********************************************************************************
  //When the next button is clicked, this sets the current generation to the next 
  //generation and sets the prev and next generations and then calls get history to 
  //get the history of the current generation
  //*********************************************************************************

  $scope.next = function(){
    console.log("Bad partners, called in next: ", $scope.badPartners);
    if($scope.generations.length > 1){
      if($scope.index >= $scope.maxGen){
        $scope.index = 0;
        $scope.prev=$scope.generations[($scope.generations.length-1)].title;
        $scope.currGen = $scope.generations[$scope.index].title;
        $scope.nex= $scope.generations[$scope.index+1].title;
        $scope.generationId = $scope.generations[$scope.index].id;
      }
      else{
        $scope.index++;
        $scope.currGen = $scope.generations[($scope.index)].title;
        $scope.prev=$scope.generations[($scope.index-1)].title;
        $scope.generationId = $scope.generations[$scope.index].id;
      if($scope.index === $scope.maxGen){
        $scope.nex = $scope.generations[0].title;
      }
      else{
        $scope.nex= $scope.generations[$scope.index+1].title;
      }
    }
    $scope.changeGen();
  }
};

  //*********************************************************************************
  //When the preious button is clicked, this sets the current generation to the previous 
  //generation and sets the prev and next generations and then calls get history to 
  //get the history of the current generation
  //*********************************************************************************

  $scope.previous = function(){
    if($scope.generations.length > 1){
      if($scope.index>=1){
        $scope.index--;
        $scope.currGen = $scope.generations[($scope.index)].title;
        $scope.nex= $scope.generations[$scope.index+1].title;
        $scope.generationId = $scope.generations[$scope.index].id;
        if($scope.index=== 0){
          $scope.prev = $scope.generations[($scope.maxGen)].title;
        }
        else{
          $scope.prev=$scope.generations[($scope.index-1)].title;
        }
      }
      else if($scope.index <= 0){
        $scope.index = $scope.maxGen;
        $scope.currGen = $scope.generations[($scope.index)].title;
        $scope.nex= $scope.generations[0].title;
        $scope.prev=$scope.generations[($scope.generations.length-2)].title;
        $scope.generationId = $scope.generations[$scope.index].id;
      }
    $scope.changeGen();
  }
};

  //*********************************************************************************
  //allows you set bad partners and remove bad partners
  //*********************************************************************************

  $scope.toggleBadPartners = function(pair){
    if($scope.badPartners.includes(pair)){
      var index = $scope.badPartners.indexOf(pair)
      var something = $scope.badPartners.splice(index,1)
    }
    else{
      $scope.badPartners.push(pair)
    }
  };
  
  //*********************************************************************************
  //for the table so we can have nice titles 
  //*********************************************************************************

  $scope.getIndexArray = function(num){
    var arr = [];
    for(var i = 0; i < num; i++){
      arr[i] = i;
    }
    return arr;
  };

  //*********************************************************************************
  //takes you back to the homepage when homepage button is clicked 
  //*********************************************************************************

  $scope.goHome = function(){
    $location.path('/');
  };

  //*********************************************************************************
  //sets the page up for success! calls all necessary functions. 
  //*********************************************************************************

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
          .then(function(evenmorestuff){
            $scope.changeGen();
            $scope.getName();
            console.log('init complete')
          })
        })
      })
    })
  }())
});
