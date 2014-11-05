angular.module('exampleApp.views.user', ['ngRoute', 'ui.bootstrap'])

.controller('UserCtrl', ['$scope', '$http', "$location", function($scope, $http) {
  $scope.helpers = HelperSpace.helpers; 
  $scope.quantity = 5;
  $scope.alerts = [];

  var historyHelper = function(i) {
    if (i < $scope.state.userStrings.length) {
      var history = {};
      history.queryString = "Query: \"" + $scope.state.userStrings[i] + "\"";
      var tripParams = {};
      var type = "unsat";
      if ($scope.state.wizardObjects[i].query) {
        tripParams = $scope.state.wizardObjects[i].query;
        type = "queriedTrips";
      }
      else if($scope.state.wizardObjects[i].booked) {
        tripParams = $scope.state.wizardObjects[i].booked;
        type = "bookedTrip";
      }
      else if($scope.state.wizardObjects[i].unbooked) {
        tripParams = $scope.state.wizardObjects[i].unbooked;
        type = "unbookedTrip";
      }
      $http.get('/api/trips', {params : tripParams})
        .success(function(data) {
          if (tripParams) {
            history.trips = data;
            history.type = type;
          }
          $scope.histories.push(history);
          historyHelper(++i);
        });
    }
  }

  $http.get('/api/state', {params : {pending : false}})
    .success(function(data) {
      $scope.state = data;
      $scope.goal = data.goal;
      $scope.histories = [];
      if ($scope.state.userStrings.length == 0) {
        history = {};
        history.queryString = "There is no stored history for this trip, but an example travel information table is shown below:";
        history.type = "default";
        $http.get('/api/trips', {params : {goalId : $scope.goal._id.toString()}})
          .success(function(data) {
            history.trips = data;
            $scope.histories.push(history);
          });
      }
      historyHelper(0);
    }); 

  $scope.submit = function(queryString) {
    $scope.histories[0].queryString = "Blarg";
    $scope.state.userStrings.push(queryString);
    $scope.state.pending = true;
    $http.post('/api/state', $scope.state).
      success(function(data) {
      });
    window.location = '/#/wizard';
  };

 
}]);
