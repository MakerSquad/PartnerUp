angular.module('PU.demoStart', [])
.controller('DemoStartController', function($scope, $location){

  $scope.goToHome = function(){
    $location.path('/demo/home');
  }

var pics = '../../../assets';
window.currentUser = {name: "Joe Demo", uid: "demoId", avatar_url: `${pics}/joedemo.jpg`};
window.pools = [
  {name: "Class 1", id: 1, role: "student", size: 2},
  {name: "Joe's Group", id: 2, role: "instructor", size: 3}
]

window.poolMemberships = [
  [
    {role: 'student', user_uid: 'demoId', user: window.currentUser},
    {role: 'student', user_uid: 'uniqueId2', user: {
      name: 'Stu Dent', uid: 'uniqueId2', avatar_url: `${pics}/stuDent.jpg`
    }},
    {role: 'student', user_uid: 'DeMonsTration', user: {
      name: 'DeMons Tration', uid: 'DeMonsTration', avatar_url: `${pics}/demons.jpg`
    }},
    {role: 'student', user_uid: '-0', user:{
      name: 'Rubber Duck Debugger', uid: '-0', avatar_url: '../../../assets/rubberducky.png'
    }}
  ],
  [
    {role: 'instructor', user_uid: 'demoId', user: window.currentUser},
    {role: 'student', user_uid: 'FriendBot', user: {
      name: 'FriendBot', uid: 'FriendBot', avatar_url: `${pics}/friendbot.jpg`
    }},
    {role: 'student', user_uid: 'DeMonsTration', user: {
      name: 'DeMons Tration', uid: 'DeMonsTration', avatar_url: `${pics}/demons.jpg`
    }},
    {role: 'student', user_uid: 'uniqueId', user: {
      name: 'Minnie Demo', uid: 'uniqueId', avatar_url: `${pics}/minniedemo.jpg`
    }},
    {role: 'student', user_uid: 'uniqueId2', user: {
      name: 'Stu Dent', uid: 'uniqueId2', avatar_url: `${pics}/stuDent.jpg`
    }}
  ]
]

window.pastGroupings = [
  [{
    generationData: {
      gen_id: 1,
      group_id: 1,
      group_size: 2,
      id: 1,
      title: "Joe's Grouping"
    },
    pairs: [
      {
        user1_uid: "demoId",
        user2_uid: "uniqueId2"
      },
      {
        user1_uid: "DeMonsTration",
        user2_uid: '-0'
      }
    ]
  }],
  []
]

window.demoUsersById = {
  'demoId': {role: 'student', user: window.currentUser, user_uid: 'demoId'},
  'uniqueId2': {role: 'student', user_uid: 'uniqueId2', user: {
    name: 'Stu Dent', uid: 'uniqueId2', avatar_url: `${pics}/stuDent.jpg`
  }},
  'DeMonsTration': {role: 'student', user_uid: 'DeMonsTration', user: {
      name: 'DeMons Tration', uid: 'DeMonsTration', avatar_url: `${pics}/demons.jpg`
    }},
  'uniqueId': {role: 'student', user_uid: 'uniqueId', user: {
      name: 'Minnie Demo', uid: 'uniqueId', avatar_url: `${pics}/minniedemo.jpg`
    }},
  'FriendBot': {role: 'student', user_uid: 'FriendBot', user: {
      name: 'FriendBot', uid: 'FriendBot', avatar_url: `${pics}/friendbot.jpg`
    }},
  '-0': {role: 'student', user_uid: '-0', user:{
      name: 'Rubber Duck Debugger', uid: '-0', avatar_url: `${pics}/rubberducky.png`
    }}
}

window.cohorts = [
  {
    name: "Hack ReacTeam",
    user_role: "instructor",
    id: 0
  },
  {
    name: "MakerSquad",
    user_role: "instructor",
    id: 1
  }
]

window.cohortMemberships = [
  [
    {role: 'instructor', user: window.currentUser, user_uid: 'demoId'},
    {role: 'student', user_uid: 'uniqueId2', user: {
    name: 'Stu Dent', uid: 'uniqueId2', avatar_url: `${pics}/stuDent.jpg`
    }},
    {role: 'student', user_uid: 'DeMonsTration', user: {
      name: 'DeMons Tration', uid: 'DeMonsTration', avatar_url: `${pics}/demons.jpg`
    }},
    {role: 'fellow', user_uid: 'uniqueId', user: {
      name: 'Minnie Demo', uid: 'uniqueId', avatar_url: `${pics}/minniedemo.jpg`
    }}
  ],
  [
    {role: 'student', user: window.currentUser, user_uid: 'demoId'},
    {role: 'student', user_uid: 'FriendBot', user: {
      name: 'FriendBot', uid: 'FriendBot', avatar_url: `${pics}/friendbot.jpg`
    }}
  ]
]
})