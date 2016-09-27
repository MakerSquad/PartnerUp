angular.module('PU.history', ['PU.factories'])

.controller('HistoryController', function ($scope, $location, $http, $routeParams, DB, StateSaver, CurrentUser,$route) {
  
  new Clipboard('.clipyclip');
  $scope.generationId = 0; //THE CURRENT GENERATION
  $scope.pastPairs = []; //all of past pairs for the group
  $scope.displayPairs = []; //all of the filtered pair
  $scope.generations = [];
  $scope.prev='prev';
  $scope.nex= 'next';
  $scope.currGen = 0; //THE CURRENT GENERATION NAME
  $scope.maxGen = 0;
  $scope.currClass = $routeParams.class; //CURRENT CLASS ID!
  $scope.badPartners = [];
  $scope.index = 0;
  $scope.library = {};
  $scope.currClassName = '';
  $scope.pastGens = {};

  $scope.mainState;

  $scope.changeClass = function(cls){
    if(cls){      
      cls = cls.mks_id;
      $location.path(`/${cls}/history`);
    }
  }

  //*********************************************************************************
  //this will get all the past pairs from the database by class id and generation id
  //*********************************************************************************

  $scope.getGen = function(cls){
  console.log("Scope currClass: ", $scope.currClass);
  return DB.getGenerations($scope.currClass)
    .then(function(data){
      if(!data.length) {
        return data;
      }
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
      return data;
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
        return data;
      });
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
      // var states = StateSaver.checkState();
      // $scope.currClassName = states.currentClass.name
      // console.log('STATES STATES', $scope.currClassName)
      for(var i = 0; i < $scope.mainState.classes.length; i++){
        if($routeParams.class === $scope.mainState.classes[i].mks_id){
          $scope.currClassName = $scope.mainState.classes[i].name;
          break;
        }
      }
    }

  // *********************************************************************************
  // this sets the generation and sets the next and previous generations so that they
  // go in orders (asc). this allows you to click on the generation title in the html
  // and set that to the current generation.
  // *********************************************************************************

  $scope.setGen = function(generation){
    $scope.currGen = generation.title;
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
  //deletes a generation from the table
  //*********************************************************************************

  $scope.deleteGen = function(){
    //delete generation from databasee
    if(confirm('Are you sure you want to delete this generation? Once clicked, its gone forever')){
    DB.deleteGeneration($scope.currClass, $scope.generationId)
      .then(function(resp){
        $route.reload();
        console.log(resp)
      })
    }
  }

  //*********************************************************************************
  //deletes a generation from the table
  //*********************************************************************************

  $scope.deleteAllGen = function(){
    console.log($scope.currClass)
    if(confirm('Are you sure you want to delete all generations? Once clicked, its gone forever')){
    DB.deleteAllGenerations($scope.currClass)
      .then(function(resp){
        $route.reload();
        console.log(resp);
      })
      .catch(function(err){
        console.log(err)
      })
    }
  }

  //*********************************************************************************
  //sets the page up for success! calls all necessary functions. 
  //*********************************************************************************

  var init = (function(){ //function that runs on load; it'll call all the fns to set up the page
    $scope.loading = true;
    $scope.mainState = StateSaver.checkState();
    console.log("Main State: ", $scope.mainState);
     CurrentUser.get()
     .then(function(userData){
       if(!$scope.mainState){
        $location.path('/');
        $scope.$apply();
       }
        $scope.getGen()
        .then(function(generations){
          $scope.getHistory()
          .then(function(pairs){$scope.makeMap()
            .then(function(evenmorestuff){
              if(generations.length){
                var pastGens = {};
                var seen = {}; //object of objects
                for(var i = 0; i < pairs.length; i++){
                  var currPair = pairs[i];
                  var currGen = currPair.gen_table_id;
                  if(!seen[currGen]){
                    seen[currGen] = {};
                  }
                  var currUser1 = $scope.library[currPair.user1_uid];
                  if(seen[currGen][currUser1]){
                    continue;
                  }
                  var currUser2 = $scope.library[currPair.user2_uid];
                  if(!pastGens[currGen]){
                    pastGens[currGen] = {};
                  }
                  if(!pastGens[currGen][currUser1]){
                    pastGens[currGen][currUser1] = [currUser1];
                  }
                  pastGens[currGen][currUser1].push(currUser2);
                  seen[currGen][currUser2] = true;
                }
                for(var gen in pastGens){
                  for(var user in pastGens[gen]){
                    if(!$scope.pastGens[gen]){
                      $scope.pastGens[gen] = [];
                    }
                    $scope.pastGens[gen].push(pastGens[gen][user]); //pushes the group (as an array) to pastgens
                  }
                }
                console.log("$scope pastGens: ", $scope.pastGens);   
              }
        
              $scope.getName();
              console.log('init complete')
              $scope.loading = false;
            })
          })
        })
     })
     .catch((err) => {
      $location.path('/');
      $scope.$apply();
     })
  }())
});
