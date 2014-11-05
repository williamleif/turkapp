#!/usr/bin/python

import pymongo
import random
import copy
import sys
import math
import datetime

TYPES = ['Bus', 'Train', 'Flight']
CITIES = ["Springfield", "Shelbyville", "Capitol City", "Odgenville"]
COMPANIES = ["Burns Inc.", "Monocorp", "Simpson and Co.", "Krustworks"]
TRIP_NUM_RNG = (100000, 999999)
DELAY_RNG = (20, 120)
DIST_RNG = (1, 7)
NUM_TRIPS = 20
MIN_NUM_TYPES = 2
MIN_NUM_MEALS = 1
FARE_BASE = 10.0
TIME_BASE = 5.0
#fare mods of the form (inc, mult)
FARE_MODS = {'Bus' : (50,50), 'Train' : (100, 100), 'Flight' : (200, 200)}
TIME_MULTS = {'Bus' : 0.5, 'Train' : 1.0, 'Flight' : 2.0}
TIME_NOISE_STD = {'Bus' : 5 , 'Train' : 10, 'Flight' : 20}
TIME_LIM_NOISE_RNG = (20, 120)
DEPART_NOISE_RNG = (-120, 120)
BUDG_MULT_RNG = (1.1,1.3)

def make_scenario():
    client = pymongo.MongoClient()
    db = client['turkapp-db']
    world = _make_world()
    db['worlds'].insert(world)
    goal, goaltrips, goalstart = _make_goal(world)
    goals = db['goals']
    goalid = str(goals.insert(goal))
    trips = _make_trips(world, goaltrips, goalstart) 
    tripsclct = db['trips']
    for trip in trips:
        trip['goalId'] = goalid
        tripsclct.insert(trip)
    currstate = {}
    currstate['createdAt'] = datetime.datetime.utcnow()
    currstate['booked'] = []
    currstate['userStrings'] = []
    currstate['wizardObjects'] = []
    currstate['goal'] = goal
    currstate['pending'] = False;
    currstate['finished'] = False;
    currstate['stage'] = 0;
    states = db['states']
    states.insert(currstate)

def _make_trips(world, goaltrips, goalstart):
    trips = []
    for i in range(NUM_TRIPS - 1):
        temptrips, _, _, _, _, _ = _make_trip_helper(world, goalstart + 
            datetime.timedelta(minutes = 
                int(TIME_BASE *
                    round(random.randint(DEPART_NOISE_RNG[0], DEPART_NOISE_RNG[1]) / TIME_BASE))))
        trips.extend(temptrips)
    trips.extend(goaltrips)
    return trips

def _make_world():
    citylist = copy.copy(CITIES)
    random.shuffle(citylist)
    distances = []
    for i in range(1, len(citylist)):
        distances.append(60 * random.randint(DIST_RNG[0], DIST_RNG[1]))
    world = {}
    world['cities'] = citylist
    world['distances'] = distances
    world['companies'] = COMPANIES
    return world

def _make_goal(world):
    typesseen = set([])
    nummeals = 0
    goalstarttime = datetime.datetime.utcnow()
    goalstarttime = goalstarttime.replace(minute=0, second=0, microsecond=0);
    while (len(typesseen) < MIN_NUM_TYPES or nummeals < MIN_NUM_MEALS):
        goaltrips, typesseen, companiesseen, nummeals, cost, timespent = (
                _make_trip_helper(world, goalstarttime))
    goal = {}
    goal['budget'] = int(FARE_BASE * 
            round((cost * random.uniform(BUDG_MULT_RNG[0], BUDG_MULT_RNG[1]))/FARE_BASE)) 
    goal['world'] = world
    goal['startTime'] = goalstarttime
    goal['endTime'] = goalstarttime + datetime.timedelta(hours = math.ceil((timespent.total_seconds() / 60.0 + 
            random.randint(TIME_LIM_NOISE_RNG[0], TIME_LIM_NOISE_RNG[1])) / 60.0 ))
    goal['numMeals'] = random.randint(1, nummeals)
    goal['needCompany'] = random.choice(list(companiesseen))
    goal['notCompany'] = random.choice(list((set(COMPANIES)).difference(companiesseen)))
    return goal, goaltrips, goalstarttime
    
def _make_trip_helper(world, starttime):
    trips = [] 
    typesseen = set([])
    companiesseen = set([])
    nummeals = 0
    prevarrivetime = starttime
    cost = 0
    for legiter in range(len(world['distances'])):
       trip = {} 
       trip['from'] = world['cities'][legiter]
       trip['to'] = world['cities'][legiter + 1]
       triptype = random.choice(TYPES)
       trip['type'] = triptype
       typesseen.add(triptype)
       trip['fare'] = int(FARE_BASE * 
               round((random.random() * FARE_MODS[triptype][1] + FARE_MODS[triptype][0]) / FARE_BASE))
       cost += trip['fare']
       trip['departTime'] = prevarrivetime + datetime.timedelta(minutes = int(TIME_BASE * 
           round(random.randint(DELAY_RNG[0], DELAY_RNG[1]) / TIME_BASE))) 
       timeinc = datetime.timedelta(minutes = world['distances'][legiter] 
               * TIME_MULTS[triptype] + int( TIME_BASE 
                   * round( random.gauss(0, TIME_NOISE_STD[triptype]) / TIME_BASE)))
       trip['arriveTime'] = trip['departTime'] + timeinc
       prevarrivetime = trip['arriveTime']
       company = random.choice(COMPANIES)
       trip['company'] = company
       companiesseen.add(company)
       if random.random() <= 0.5:
           nummeals += 1
           trip['meal'] = True
       else:
           trip['meal'] = False
       trip['number'] = random.randint(TRIP_NUM_RNG[0], TRIP_NUM_RNG[1])
       trips.append(trip)
    timespent = trips[-1]['arriveTime'] - starttime

    return trips, typesseen, companiesseen, nummeals, cost, timespent

  
if __name__ == '__main__':
    for i in range(int(sys.argv[1])):
        make_scenario()
