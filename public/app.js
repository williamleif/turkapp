var HelperSpace = HelperSpace || {};
HelperSpace.helpers = {
  boolToYesNo : function(bool) {
    if (bool) {
      return 'Yes'
    } else {
      return 'No'
    }
  }
 };

angular.module('exampleApp', [
  'ngRoute',
  'exampleApp.views.user',
  'exampleApp.views.wizard'
])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/wizard', {
    templateUrl : 'views/wizard/wizard.html',
    controller : 'WizardCtrl'
  });
  $routeProvider.when('/user', {
    templateUrl : 'views/user/user.html',
    controller : 'UserCtrl'
  });
  $routeProvider.otherwise({redirectTo: '/user'});
}]);

