var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/turkapp-db');

var tripSchema = mongoose.Schema({
    goalId : String,
    number: Number,
    type : String,
    from : String,
    to : String,
    departTime : Date,
    arriveTime : Date,
    company : String,
    meal : Boolean,
    fare : Number
});
var Trip = mongoose.model('Trip', tripSchema, 'trips');
    
var goalSchema = mongoose.Schema({
    world : { 
      cities : [String],
      distances : [Number],
      companies : [String]
    },
    budget : Number,
    timeLimit : Number,
    numMeals : Number,
    needCompany : String,
    notCompany : String
});
var Goal = mongoose.model('Goal', goalSchema, 'goals');

var currStateSchema = mongoose.Schema({
    goal : mongoose.Schema.Types.Mixed,
    createdAt : Date,
    userStrings : [String],
    wizardObjects : [mongoose.Schema.Types.Mixed],
    booked : [mongoose.Schema.Types.Mixed],
    moneySpent : Number,
    numMealsHad : Number,
    timeSpent : Number,
    pending : Boolean,
    finished : Boolean,
    stage : Number
});
currStateSchema.statics.random = function(criteria, callback) {
    this.count(criteria, function(err, count) {
      if (err) {
        return callback(err);
      }
    var rand = Math.floor(Math.random() * count);
    this.findOne(criteria).skip(rand).exec(callback);
  }.bind(this));
};
currStateSchema.pre('save', function(next) {
  var now = new Date();
  this.createdAt = now;
  if (!this.pending) {
    this.stage = this.stage + 1;
  }
  if (this.goal.world.cities.length - 1 == this.booked.length) {
    this.finished = true;
  }
  next();
});
var State = mongoose.model('State', currStateSchema, 'states');


module.exports = {
  Trip : Trip,
  Goal : Goal,
  State : State,
}
