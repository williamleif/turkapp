angular.module('exampleApp.views.wizard', ['ngRoute', 'ui.bootstrap.datetimepicker'])

.controller('WizardCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.helpers = HelperSpace.helpers; 
  $scope.quantity = 5;
  $scope.wizardData = {};
  $scope.wizardData.type = "Flight";
  $scope.constraints = {};
  $scope.alerts = [];
  $scope.cantSubmit = true;

  var historyHelper = function(i) {
    if (i < $scope.state.userStrings.length - 1) {
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
  // GETs
  $http.get('/api/trips', {params : {}}).success(function(data) {
    $scope.trips = data;
  });
  
  $http.get('api/state', {params : {pending : true}})
    .success(function(data) {
      $scope.state = data;
      $scope.goal = data.goal;
      $scope.histories = [];
      if ($scope.state.userStrings.length == 1) {
        var history = {};
        history.queryString = "There is no stored history for this user."; 
        history.trips = {}
        history.type = 'default';
        $scope.histories.push(history);
      } else {
        $scope.hasHistory = true;
        historyHelper(0);
      }
      $scope.wizardData = {goalId : $scope.goal._id.toString(), type : "Flight"};
  });

  $scope.update = function(wizardData, debugString) {
    if (debugString) 
      regexHelper(debugString, wizardData);
    $scope.constraints = angular.copy(wizardData);
    $http.get('/api/trips', {params :  $scope.constraints})
      .success(function(data) {
        $scope.trips = data;
        $scope.cantSubmit = false;
    });
  }

  $scope.submit = function() {
    $scope.state.wizardObjects.push({query : $scope.constraints});
    $scope.state.pending = false;
    $http.post('/api/state', $scope.state)
      .success(function(data) {
    });
    window.location = "/#/user";
  }

  $scope.unsat = function() {
    $scope.state.wizardObjects.push({unsat : true});
    $scope.state.pending = false;
    $http.post('/api/state', $scope.state)
      .success(function(data) {
    });
    window.location = "/#/user";
  }

 $scope.resetControls = function () {
   $scope.wizardData = {goalId : $scope.goal._id.toString(), type : "Flight"};
 }


 $scope.book = function(bookNumber) {
    if (!bookNumber) {
      bookNumber = -1;
    }
    $http.get('/api/trips', {params : {number : bookNumber}})
      .success(function(data) {
      var errMessage = "";
      if (data && data.length > 0) {
        for (i = 0; i < $scope.state.booked.length; i++) {
          var alreadyBooked = $scope.state.booked[i];
          if (alreadyBooked.from == data[0].from) {
            errMessage = "This portion of the journey is already booked! The user must unbook the existing transportation for this portion."; 
          }
        }
      } else {
        errMessage = "That trip number is not valid!";
      }
      if (!(errMessage)) {
        $scope.state.booked.push(data[0]);
        $scope.state.wizardObjects.push({booked : data[0]});
        $scope.state.pending = false;
        $http.post('/api/state', $scope.state)
          .success(function(data) {
         });
        window.location = "/#/user";
      } else {
        $scope.alerts.push({type : "danger", msg : errMessage});
      }
     });
  };

  $scope.unbook = function(bookNumber) {
    if(!bookNumber) {
      bookNumber = -1;
    }
    var errMessage = "That trip number is not valid for unbooking!";
    for(i = 0; i < $scope.state.booked.length; i++) {
      if ($scope.state.booked[i].number == bookNumber) {
        errMessage = null;
        $scope.state.wizardObjects.push({unbooked : $scope.state.booked[i]});
        $scope.state.booked.splice(i, 1);
      }
    }
    if (errMessage) {
        $scope.alerts.push({type : "danger", msg : errMessage});
    } else {
        $scope.state.pending = false;
        $http.post('/api/state', $scope.state)
          .success(function(data) {
         });
        window.location = "/#/user";
    }
  };
  

  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

  var regexHelper = function(debugString, wizardData) {
    var regex = /.*from "([^"]*)"/;
    var match = debugString.match(regex);
    if (match) {
      $scope.wizardData.from = match[1];
    }
    regex = /.*to "([^"]*)"/;
    match = debugString.match(regex);
    if (match) {
      wizardData.to = match[1];
    }
    regex = /.*type (\w*)/;
    match = debugString.match(regex);
    if (match) {
      wizardData.type = match[1];
    }
    regex = /.*company "([^"]*)"/;
    match = debugString.match(regex);
    if (match) {
      wizardData.company = match[1];
    }
    regex = /.*sort (\w*)/;
    match = debugString.match(regex);
    if (match) { 
      if (match[1] == 'departure') {
        wizardData.sort = "departTime";
      }
      if (match[1] == 'arrival') {
        wizardData.sort = "arriveTime";
      }
      if (match[1] == 'fare') {
        wizardData.sort = "fare";
      }
    }
    regex = /.*farelt (\d*)/;
    match = debugString.match(regex);
    if (match) {
      wizardData.fare_$lt = parseInt(match[1]);
    }
    regex = /.*faregt (\d*)/;
    match = debugString.match(regex);
    if (match) {
      wizardData.fare_$gt = parseInt(match[1]);
    }
    regex = /.*departBefore (\S*)/;
    match = debugString.match(regex);
    if (match) {
      wizardData.departTime_$lt = Date.parse(match[1]); 
    }
    regex = /.*departAfter (\S*)/;
    match = debugString.match(regex);
    if (match) {
      wizardData.departTime_$gt = Date.parse(match[1]); 
    }
    regex = /.*arriveBefore (\S*)/;
    match = debugString.match(regex);
    if (match) {
      wizardData.arriveTime_$lt = Date.parse(match[1]); 
    }
    regex = /.*arriveAfter (\S*)/;
    match = debugString.match(regex);
    if (match) {
      wizardData.departTime_$gt = Date.parse(match[1]); 
    }

  }


}]);



