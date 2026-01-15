export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

export const theoryQuestions: Question[] = [
  // Speed Limits
  {
    id: 1,
    question: "What is the national speed limit for cars on a single carriageway?",
    options: ["50 mph", "60 mph", "70 mph", "80 mph"],
    correctAnswer: 1,
    explanation: "The national speed limit for cars on a single carriageway is 60 mph.",
    category: "Speed Limits"
  },
  {
    id: 2,
    question: "What is the speed limit on a motorway for cars?",
    options: ["60 mph", "70 mph", "80 mph", "No limit"],
    correctAnswer: 1,
    explanation: "The national speed limit for cars on motorways is 70 mph.",
    category: "Speed Limits"
  },
  {
    id: 3,
    question: "What is the speed limit in a built-up area unless otherwise indicated?",
    options: ["20 mph", "30 mph", "40 mph", "50 mph"],
    correctAnswer: 1,
    explanation: "The default speed limit in built-up areas with street lighting is 30 mph unless signs indicate otherwise.",
    category: "Speed Limits"
  },
  {
    id: 4,
    question: "What is the national speed limit for cars on a dual carriageway?",
    options: ["50 mph", "60 mph", "70 mph", "80 mph"],
    correctAnswer: 2,
    explanation: "The national speed limit for cars on dual carriageways is 70 mph.",
    category: "Speed Limits"
  },
  {
    id: 5,
    question: "What speed limit applies when you see street lights but no other signs?",
    options: ["20 mph", "30 mph", "40 mph", "60 mph"],
    correctAnswer: 1,
    explanation: "Street lights usually mean there is a 30 mph speed limit unless signs show otherwise.",
    category: "Speed Limits"
  },

  // Pedestrian Crossings
  {
    id: 6,
    question: "What should you do when approaching a zebra crossing?",
    options: [
      "Speed up to pass before pedestrians cross",
      "Flash your headlights to signal pedestrians",
      "Be prepared to stop and give way to pedestrians",
      "Sound your horn to warn pedestrians"
    ],
    correctAnswer: 2,
    explanation: "You must be prepared to stop and give way to pedestrians waiting at or on a zebra crossing.",
    category: "Pedestrian Crossings"
  },
  {
    id: 7,
    question: "At a pelican crossing, what does a flashing amber light mean?",
    options: [
      "Stop and wait for the green light",
      "Give way to pedestrians still on the crossing",
      "You must not proceed under any circumstances",
      "Accelerate quickly through the crossing"
    ],
    correctAnswer: 1,
    explanation: "A flashing amber light at a pelican crossing means give way to pedestrians still on the crossing, then proceed if clear.",
    category: "Pedestrian Crossings"
  },
  {
    id: 8,
    question: "What type of crossing has sensors to detect pedestrians on the crossing?",
    options: ["Zebra crossing", "Pelican crossing", "Puffin crossing", "Toucan crossing"],
    correctAnswer: 2,
    explanation: "Puffin crossings have sensors that detect when pedestrians are still on the crossing and hold the red light for drivers.",
    category: "Pedestrian Crossings"
  },
  {
    id: 9,
    question: "Which crossing allows cyclists and pedestrians to cross together?",
    options: ["Zebra crossing", "Pelican crossing", "Puffin crossing", "Toucan crossing"],
    correctAnswer: 3,
    explanation: "Toucan crossings allow both pedestrians and cyclists to cross together. The name comes from 'two can' cross.",
    category: "Pedestrian Crossings"
  },
  {
    id: 10,
    question: "What should you do if a pedestrian with a white cane is waiting at a crossing?",
    options: [
      "Sound your horn to let them know you're there",
      "Flash your headlights",
      "Be patient and wait, they may need more time",
      "Drive past quickly to clear the way"
    ],
    correctAnswer: 2,
    explanation: "A white cane indicates the person is visually impaired. Be patient and give them plenty of time to cross safely.",
    category: "Pedestrian Crossings"
  },

  // Traffic Signs
  {
    id: 11,
    question: "What does a red traffic light mean?",
    options: [
      "Slow down and proceed with caution",
      "Stop and wait behind the stop line",
      "Give way to traffic from the right",
      "Proceed if the road is clear"
    ],
    correctAnswer: 1,
    explanation: "A red traffic light means you must stop and wait behind the stop line until the light changes to green.",
    category: "Traffic Signs"
  },
  {
    id: 12,
    question: "What does an amber traffic light mean?",
    options: [
      "Speed up to clear the junction",
      "Stop at the stop line, unless it's unsafe to do so",
      "Give way to oncoming traffic",
      "Proceed with caution"
    ],
    correctAnswer: 1,
    explanation: "An amber light means stop at the stop line. You may only go on if the amber appears after you have crossed the stop line or if stopping would cause an accident.",
    category: "Traffic Signs"
  },
  {
    id: 13,
    question: "What shape is a 'Give Way' sign?",
    options: ["Circular", "Triangular pointing up", "Triangular pointing down", "Square"],
    correctAnswer: 2,
    explanation: "A Give Way sign is an inverted triangle (pointing down) with a red border.",
    category: "Traffic Signs"
  },
  {
    id: 14,
    question: "What does a circular sign with a red border indicate?",
    options: ["Information", "Warning", "Prohibition or restriction", "Direction"],
    correctAnswer: 2,
    explanation: "Circular signs with red borders give orders and usually prohibit or restrict something.",
    category: "Traffic Signs"
  },
  {
    id: 15,
    question: "What colour background does a motorway sign have?",
    options: ["Green", "Blue", "White", "Brown"],
    correctAnswer: 1,
    explanation: "Motorway signs have a blue background.",
    category: "Traffic Signs"
  },
  {
    id: 16,
    question: "What does a triangular road sign indicate?",
    options: ["Information", "Warning", "Order", "Direction"],
    correctAnswer: 1,
    explanation: "Triangular road signs are warning signs, alerting you to hazards ahead.",
    category: "Traffic Signs"
  },
  {
    id: 17,
    question: "What does a 'STOP' sign require you to do?",
    options: [
      "Slow down and give way if necessary",
      "Stop completely at the line, even if the road is clear",
      "Stop only if there is traffic approaching",
      "Flash your headlights before proceeding"
    ],
    correctAnswer: 1,
    explanation: "At a STOP sign, you must stop completely at the line regardless of whether there is traffic or not.",
    category: "Traffic Signs"
  },
  {
    id: 18,
    question: "What does a brown road sign indicate?",
    options: [
      "Primary route",
      "Motorway information",
      "Tourist attraction",
      "Temporary road works"
    ],
    correctAnswer: 2,
    explanation: "Brown signs give directions to tourist attractions and amenities.",
    category: "Traffic Signs"
  },

  // Vehicle Safety
  {
    id: 19,
    question: "What is the minimum tread depth for car tyres?",
    options: ["1.0 mm", "1.6 mm", "2.0 mm", "2.5 mm"],
    correctAnswer: 1,
    explanation: "The legal minimum tread depth for car tyres is 1.6 mm across the central three-quarters of the tyre.",
    category: "Vehicle Safety"
  },
  {
    id: 20,
    question: "How often should you check your vehicle's tyre pressures?",
    options: ["Once a year", "Every month", "At least once a week", "Only before long journeys"],
    correctAnswer: 2,
    explanation: "You should check your tyre pressures at least once a week, and always before long journeys.",
    category: "Vehicle Safety"
  },
  {
    id: 21,
    question: "What should you check before starting a long journey?",
    options: [
      "Only the fuel level",
      "Oil, water, tyres, and lights",
      "Just the windscreen wipers",
      "Only the mirrors"
    ],
    correctAnswer: 1,
    explanation: "Before a long journey, check oil, coolant, tyres (including spare), lights, fuel, and windscreen washer fluid.",
    category: "Vehicle Safety"
  },
  {
    id: 22,
    question: "What could be the cause of heavy steering?",
    options: [
      "Over-inflated tyres",
      "Under-inflated tyres",
      "Worn brake pads",
      "A faulty exhaust"
    ],
    correctAnswer: 1,
    explanation: "Under-inflated tyres can cause heavy steering as there is more friction between the tyre and the road.",
    category: "Vehicle Safety"
  },
  {
    id: 23,
    question: "What should you do if your brake pedal feels spongy?",
    options: [
      "Continue driving but brake earlier",
      "Pump the brake pedal repeatedly",
      "Have the brakes checked immediately",
      "Only use the handbrake for stopping"
    ],
    correctAnswer: 2,
    explanation: "A spongy brake pedal may indicate air in the brake fluid or a brake fluid leak. Have it checked immediately.",
    category: "Vehicle Safety"
  },
  {
    id: 24,
    question: "What can cause excessive tyre wear?",
    options: [
      "Correct wheel alignment",
      "Faulty brakes or suspension",
      "Using the correct tyre pressure",
      "Regular tyre rotation"
    ],
    correctAnswer: 1,
    explanation: "Faulty brakes, suspension, or incorrect wheel alignment can cause excessive or uneven tyre wear.",
    category: "Vehicle Safety"
  },

  // Lighting
  {
    id: 25,
    question: "When must you use your headlights?",
    options: [
      "Only at night",
      "When visibility is seriously reduced",
      "Only in fog",
      "When parked on the road"
    ],
    correctAnswer: 1,
    explanation: "You must use your headlights when visibility is seriously reduced, generally when you cannot see for more than 100 metres.",
    category: "Lighting"
  },
  {
    id: 26,
    question: "When should you use fog lights?",
    options: [
      "Whenever it is dark",
      "In heavy rain",
      "When visibility is seriously reduced below 100 metres",
      "On all unlit roads"
    ],
    correctAnswer: 2,
    explanation: "Only use fog lights when visibility is seriously reduced to less than 100 metres. Remember to switch them off when visibility improves.",
    category: "Lighting"
  },
  {
    id: 27,
    question: "When should you dip your headlights?",
    options: [
      "Only in built-up areas",
      "When meeting or following other traffic",
      "Only on motorways",
      "Never, always use full beam"
    ],
    correctAnswer: 1,
    explanation: "Dip your headlights when meeting oncoming vehicles and when following other vehicles to avoid dazzling other drivers.",
    category: "Lighting"
  },
  {
    id: 28,
    question: "What lights must be on when parking at night on a road with a speed limit over 30 mph?",
    options: [
      "No lights required",
      "Sidelights (parking lights)",
      "Hazard warning lights",
      "Full headlights"
    ],
    correctAnswer: 1,
    explanation: "When parking at night on a road with a speed limit over 30 mph, you must leave your sidelights on.",
    category: "Lighting"
  },

  // Drink Driving
  {
    id: 29,
    question: "What is the legal alcohol limit for drivers in England?",
    options: [
      "35 micrograms per 100ml of breath",
      "50 micrograms per 100ml of breath",
      "80 micrograms per 100ml of breath",
      "Zero tolerance"
    ],
    correctAnswer: 0,
    explanation: "The legal alcohol limit in England is 35 micrograms of alcohol per 100 millilitres of breath.",
    category: "Drink Driving"
  },
  {
    id: 30,
    question: "How long after drinking heavily might you still be over the limit?",
    options: [
      "2 hours",
      "6 hours",
      "12 hours",
      "Up to 24 hours or more"
    ],
    correctAnswer: 3,
    explanation: "Alcohol can stay in your system for many hours. You may still be over the limit the morning after drinking heavily.",
    category: "Drink Driving"
  },
  {
    id: 31,
    question: "What is the only way to sober up after drinking alcohol?",
    options: [
      "Drinking black coffee",
      "Taking a cold shower",
      "Eating a large meal",
      "Time"
    ],
    correctAnswer: 3,
    explanation: "Time is the only thing that will sober you up. Coffee, showers, or food cannot speed up the process.",
    category: "Drink Driving"
  },
  {
    id: 32,
    question: "How does alcohol affect your driving?",
    options: [
      "Improves concentration",
      "Reduces reaction time and impairs judgement",
      "Makes you more alert",
      "Has no effect if you eat first"
    ],
    correctAnswer: 1,
    explanation: "Alcohol reduces reaction times, impairs judgement, and gives a false sense of confidence.",
    category: "Drink Driving"
  },

  // Motorways
  {
    id: 33,
    question: "What should you do if you break down on a motorway?",
    options: [
      "Stay in your vehicle with your seatbelt on",
      "Walk to the next exit",
      "Get out and stand behind the crash barrier",
      "Try to repair your vehicle"
    ],
    correctAnswer: 2,
    explanation: "If you break down on a motorway, you should get out via the left-hand door and stand behind the crash barrier if there is one.",
    category: "Motorways"
  },
  {
    id: 34,
    question: "What is the minimum distance you should use to follow the vehicle ahead on a motorway?",
    options: [
      "One car length",
      "Two-second gap",
      "50 metres",
      "100 metres"
    ],
    correctAnswer: 1,
    explanation: "Use the two-second rule in good conditions. In wet weather, double this to at least four seconds.",
    category: "Motorways"
  },
  {
    id: 35,
    question: "Which vehicles are not allowed on motorways?",
    options: [
      "Learner drivers with a full licence holder",
      "Motorcycles over 50cc",
      "Pedestrians, cyclists, and learner drivers",
      "Caravans"
    ],
    correctAnswer: 2,
    explanation: "Pedestrians, cyclists, learner drivers (unless with an approved instructor), and vehicles under 50cc are not allowed on motorways.",
    category: "Motorways"
  },
  {
    id: 36,
    question: "What do red flashing lights above your lane on a motorway mean?",
    options: [
      "There is congestion ahead",
      "You must not go beyond this signal in that lane",
      "The lane is about to close, move when safe",
      "There is a broken-down vehicle ahead"
    ],
    correctAnswer: 1,
    explanation: "Red flashing lights mean you must not go beyond the signal in that lane. It indicates the lane is closed.",
    category: "Motorways"
  },
  {
    id: 37,
    question: "What is the hard shoulder used for on a motorway?",
    options: [
      "Overtaking slow traffic",
      "Stopping in emergencies only",
      "Picking up hitchhikers",
      "Resting when tired"
    ],
    correctAnswer: 1,
    explanation: "The hard shoulder should only be used in emergencies. Never stop on it unless absolutely necessary.",
    category: "Motorways"
  },
  {
    id: 38,
    question: "On a smart motorway, what does a red X above a lane mean?",
    options: [
      "Lane is for emergency vehicles only",
      "Lane is closed, do not use it",
      "Slow traffic should use this lane",
      "Variable speed limit applies"
    ],
    correctAnswer: 1,
    explanation: "A red X means the lane is closed. You must not drive in a lane showing a red X.",
    category: "Motorways"
  },

  // Stopping Distances
  {
    id: 39,
    question: "What is the stopping distance at 70 mph in dry conditions?",
    options: ["53 metres", "73 metres", "96 metres", "120 metres"],
    correctAnswer: 2,
    explanation: "The typical stopping distance at 70 mph is 96 metres (315 feet) - 21 metres thinking distance and 75 metres braking distance.",
    category: "Stopping Distances"
  },
  {
    id: 40,
    question: "What is the stopping distance at 30 mph in dry conditions?",
    options: ["14 metres", "23 metres", "36 metres", "53 metres"],
    correctAnswer: 1,
    explanation: "The typical stopping distance at 30 mph is 23 metres (75 feet) - 9 metres thinking distance and 14 metres braking distance.",
    category: "Stopping Distances"
  },
  {
    id: 41,
    question: "How does wet weather affect stopping distances?",
    options: [
      "No effect",
      "Stopping distances are doubled",
      "Stopping distances are halved",
      "Only affects thinking distance"
    ],
    correctAnswer: 1,
    explanation: "In wet conditions, stopping distances can at least double because tyres have less grip on the road.",
    category: "Stopping Distances"
  },
  {
    id: 42,
    question: "What is 'thinking distance'?",
    options: [
      "The distance your car travels while braking",
      "The distance travelled while you react to a hazard",
      "The total stopping distance",
      "The distance you can see ahead"
    ],
    correctAnswer: 1,
    explanation: "Thinking distance is how far you travel while reacting to a hazard before you start to brake.",
    category: "Stopping Distances"
  },
  {
    id: 43,
    question: "What factors can increase your thinking distance?",
    options: [
      "New tyres",
      "Tiredness, distractions, or alcohol",
      "Good road conditions",
      "Daylight"
    ],
    correctAnswer: 1,
    explanation: "Tiredness, distractions, drugs, alcohol, and illness can all increase your reaction time and thinking distance.",
    category: "Stopping Distances"
  },

  // Junctions
  {
    id: 44,
    question: "Who has priority at an unmarked crossroads?",
    options: [
      "Traffic from the right",
      "Traffic from the left",
      "The larger vehicle",
      "No one has priority"
    ],
    correctAnswer: 3,
    explanation: "At an unmarked crossroads, no one has priority. You should approach carefully and be prepared to stop.",
    category: "Junctions"
  },
  {
    id: 45,
    question: "When should you use the MSM routine?",
    options: [
      "Only when turning right",
      "Before any change in direction or speed",
      "Only at roundabouts",
      "Only in town centres"
    ],
    correctAnswer: 1,
    explanation: "Use Mirror-Signal-Manoeuvre before any change of direction or speed, including overtaking, turning, and changing lanes.",
    category: "Junctions"
  },
  {
    id: 46,
    question: "When emerging from a junction, which traffic should you give way to?",
    options: [
      "Only traffic from the right",
      "Only traffic from the left",
      "Traffic from both directions on the main road",
      "Only buses and emergency vehicles"
    ],
    correctAnswer: 2,
    explanation: "When emerging from a junction onto a main road, you should give way to traffic from both directions.",
    category: "Junctions"
  },
  {
    id: 47,
    question: "At a box junction, when may you enter the yellow box?",
    options: [
      "Only when your exit is clear",
      "When traffic lights are green",
      "If you are turning right and only waiting for oncoming traffic",
      "Never"
    ],
    correctAnswer: 2,
    explanation: "You may enter a box junction if your exit is clear, OR if you're turning right and only prevented from doing so by oncoming traffic.",
    category: "Junctions"
  },

  // Roundabouts
  {
    id: 48,
    question: "When approaching a roundabout, who has priority?",
    options: [
      "Vehicles on your right",
      "Vehicles on the roundabout from your right",
      "The largest vehicle",
      "Vehicles approaching from the left"
    ],
    correctAnswer: 1,
    explanation: "Give priority to traffic already on the roundabout from your right, unless signs or markings indicate otherwise.",
    category: "Roundabouts"
  },
  {
    id: 49,
    question: "Which lane should you use to go straight ahead at a roundabout?",
    options: [
      "Always the right lane",
      "Always the left lane",
      "Either lane, depending on the road markings",
      "The middle lane only"
    ],
    correctAnswer: 2,
    explanation: "The lane you use depends on the road markings and signs. Generally, use the left lane unless markings indicate otherwise.",
    category: "Roundabouts"
  },
  {
    id: 50,
    question: "When should you signal left on a roundabout?",
    options: [
      "As soon as you enter",
      "After passing the exit before yours",
      "Only if turning left",
      "You should never signal on a roundabout"
    ],
    correctAnswer: 1,
    explanation: "Signal left after you have passed the exit before the one you want to take.",
    category: "Roundabouts"
  },

  // Overtaking
  {
    id: 51,
    question: "When should you NOT overtake?",
    options: [
      "On a clear dual carriageway",
      "Approaching a bend or junction",
      "On a wide, straight road with good visibility",
      "When the vehicle ahead is going slowly"
    ],
    correctAnswer: 1,
    explanation: "Do not overtake if you cannot see far enough ahead, such as when approaching bends, junctions, or pedestrian crossings.",
    category: "Overtaking"
  },
  {
    id: 52,
    question: "What does a double white line with a solid line nearest to you mean?",
    options: [
      "You may cross to overtake",
      "You must not cross or straddle the line",
      "You may cross if it is safe",
      "It only applies to heavy vehicles"
    ],
    correctAnswer: 1,
    explanation: "A solid white line nearest to you means you must not cross or straddle it except to enter premises or a side road.",
    category: "Overtaking"
  },
  {
    id: 53,
    question: "How should you overtake a horse and rider?",
    options: [
      "Sound your horn and pass quickly",
      "Pass slowly, giving them plenty of room",
      "Flash your lights to warn them",
      "Overtake as you would any other vehicle"
    ],
    correctAnswer: 1,
    explanation: "Pass horses and riders slowly and with plenty of room. Avoid sudden movements or loud noises that could startle the horse.",
    category: "Overtaking"
  },

  // Hazard Perception
  {
    id: 54,
    question: "What is a hazard?",
    options: [
      "Any road sign",
      "Anything that may cause you to change speed or direction",
      "Only other vehicles",
      "Speed bumps only"
    ],
    correctAnswer: 1,
    explanation: "A hazard is anything that may cause you to change speed, direction, or stop.",
    category: "Hazard Perception"
  },
  {
    id: 55,
    question: "What should you do when approaching a school?",
    options: [
      "Sound your horn to warn children",
      "Drive at the posted limit regardless of children",
      "Slow down and be prepared to stop",
      "Flash your headlights at children"
    ],
    correctAnswer: 2,
    explanation: "Near schools, slow down and be alert for children who may run into the road unexpectedly.",
    category: "Hazard Perception"
  },
  {
    id: 56,
    question: "What should you be aware of when driving past parked vehicles?",
    options: [
      "Children may run out between them",
      "Nothing, parked vehicles are not hazards",
      "Only watch for doors opening",
      "Only check for reversing vehicles"
    ],
    correctAnswer: 0,
    explanation: "Be aware of doors opening, pedestrians (especially children) stepping out, and vehicles pulling out.",
    category: "Hazard Perception"
  },
  {
    id: 57,
    question: "What hazard should you be aware of at a blind bend?",
    options: [
      "Only slow-moving vehicles",
      "Oncoming vehicles in your lane",
      "Nothing if you are on your side of the road",
      "Only cyclists"
    ],
    correctAnswer: 1,
    explanation: "At blind bends, be prepared for oncoming vehicles, cyclists, pedestrians, or other hazards you cannot yet see.",
    category: "Hazard Perception"
  },

  // Vulnerable Road Users
  {
    id: 58,
    question: "What should you do when overtaking a cyclist?",
    options: [
      "Pass as closely as possible",
      "Sound your horn to warn them",
      "Give at least 1.5 metres space at speeds up to 30 mph",
      "Flash your headlights"
    ],
    correctAnswer: 2,
    explanation: "Give cyclists at least 1.5 metres space when overtaking at speeds up to 30 mph, and more space at higher speeds.",
    category: "Vulnerable Road Users"
  },
  {
    id: 59,
    question: "What does a person carrying a white stick with red bands indicate?",
    options: [
      "They are visually impaired",
      "They are deaf and blind",
      "They are partially sighted",
      "They need help crossing the road"
    ],
    correctAnswer: 1,
    explanation: "A white stick with red bands indicates the person is both deaf and blind.",
    category: "Vulnerable Road Users"
  },
  {
    id: 60,
    question: "Why should you check for motorcyclists at junctions?",
    options: [
      "They always have priority",
      "They are smaller and can be harder to see",
      "They travel faster than cars",
      "They cannot stop quickly"
    ],
    correctAnswer: 1,
    explanation: "Motorcyclists are more vulnerable because they are smaller and can be hidden behind other vehicles or obstacles.",
    category: "Vulnerable Road Users"
  },
  {
    id: 61,
    question: "What should you do when approaching horse riders from behind?",
    options: [
      "Sound your horn to alert them",
      "Pass quickly to reduce the time near them",
      "Slow down and be prepared to stop",
      "Flash your headlights"
    ],
    correctAnswer: 2,
    explanation: "Slow down, give plenty of room, and be ready to stop. Horses can be unpredictable when startled.",
    category: "Vulnerable Road Users"
  },

  // Weather Conditions
  {
    id: 62,
    question: "How should you drive in fog?",
    options: [
      "Use full beam headlights",
      "Stay close to the vehicle ahead",
      "Use dipped headlights and slow down",
      "Drive as normal"
    ],
    correctAnswer: 2,
    explanation: "In fog, use dipped headlights, reduce speed, and increase the distance between you and the vehicle ahead.",
    category: "Weather Conditions"
  },
  {
    id: 63,
    question: "What should you do if you aquaplane?",
    options: [
      "Brake hard",
      "Steer sharply to regain control",
      "Ease off the accelerator and avoid braking",
      "Accelerate to drive through the water"
    ],
    correctAnswer: 2,
    explanation: "If you aquaplane, ease off the accelerator and don't brake until your steering returns to normal.",
    category: "Weather Conditions"
  },
  {
    id: 64,
    question: "Where is ice most likely to form on the road?",
    options: [
      "On busy roads",
      "In sheltered areas and bridges",
      "Near shopping centres",
      "On newly surfaced roads"
    ],
    correctAnswer: 1,
    explanation: "Ice is most likely to form on exposed areas, bridges, sheltered stretches, and areas shaded by trees or buildings.",
    category: "Weather Conditions"
  },
  {
    id: 65,
    question: "How does heavy rain affect your driving?",
    options: [
      "It has no effect",
      "It reduces visibility and grip",
      "It only affects visibility",
      "It only affects braking"
    ],
    correctAnswer: 1,
    explanation: "Heavy rain reduces visibility and grip. Stopping distances can double, and spray from other vehicles reduces visibility.",
    category: "Weather Conditions"
  },
  {
    id: 66,
    question: "What should you do when driving in strong crosswinds?",
    options: [
      "Drive faster to get through quickly",
      "Hold the steering wheel loosely",
      "Be prepared for sudden gusts and keep a firm grip on the wheel",
      "Use your hazard lights"
    ],
    correctAnswer: 2,
    explanation: "In strong crosswinds, keep a firm grip on the steering wheel and be prepared for sudden gusts, especially on exposed roads.",
    category: "Weather Conditions"
  },

  // Documents and Insurance
  {
    id: 67,
    question: "What is the minimum level of insurance required by law?",
    options: [
      "Fully comprehensive",
      "Third party only",
      "Third party, fire and theft",
      "No insurance is required"
    ],
    correctAnswer: 1,
    explanation: "The minimum level of insurance required by law is third party only, which covers damage to others but not your own vehicle.",
    category: "Documents"
  },
  {
    id: 68,
    question: "What document must you have to drive on public roads?",
    options: [
      "Only a driving licence",
      "A valid driving licence and valid insurance",
      "Only insurance",
      "Just your passport"
    ],
    correctAnswer: 1,
    explanation: "You must have a valid driving licence and valid insurance to drive on public roads. The vehicle must also have a valid MOT if over 3 years old.",
    category: "Documents"
  },
  {
    id: 69,
    question: "At what age does a car first require an MOT?",
    options: [
      "1 year old",
      "2 years old",
      "3 years old",
      "5 years old"
    ],
    correctAnswer: 2,
    explanation: "Cars require their first MOT when they are 3 years old, then annually after that.",
    category: "Documents"
  },
  {
    id: 70,
    question: "What should you do if you are asked to produce your driving documents?",
    options: [
      "You must always have them with you",
      "Produce them within 7 days at a police station",
      "Post them to the police",
      "Ignore the request"
    ],
    correctAnswer: 1,
    explanation: "If asked, you must produce your documents within 7 days at a police station of your choice.",
    category: "Documents"
  },

  // Attitude and Behaviour
  {
    id: 71,
    question: "What should you do if another driver is tailgating you?",
    options: [
      "Brake sharply to make them back off",
      "Speed up to increase the gap",
      "Allow them to overtake when safe",
      "Ignore them completely"
    ],
    correctAnswer: 2,
    explanation: "If you're being tailgated, don't speed up or brake suddenly. Allow them to overtake when it is safe to do so.",
    category: "Attitude"
  },
  {
    id: 72,
    question: "What should you do if you feel tired while driving?",
    options: [
      "Open the window and continue",
      "Turn up the radio",
      "Stop in a safe place and rest",
      "Drink coffee and continue"
    ],
    correctAnswer: 2,
    explanation: "If you feel tired, find a safe place to stop and rest. Fresh air and caffeine are only temporary fixes.",
    category: "Attitude"
  },
  {
    id: 73,
    question: "What effect can stress have on your driving?",
    options: [
      "It makes you drive more carefully",
      "It can make you aggressive and impatient",
      "It has no effect",
      "It improves concentration"
    ],
    correctAnswer: 1,
    explanation: "Stress can make you aggressive, impatient, and more likely to take risks while driving.",
    category: "Attitude"
  },
  {
    id: 74,
    question: "How should you react if another driver makes a mistake?",
    options: [
      "Sound your horn and flash your lights",
      "Follow them and give them a lesson",
      "Stay calm and don't retaliate",
      "Overtake and brake in front of them"
    ],
    correctAnswer: 2,
    explanation: "Stay calm and don't retaliate. Road rage can escalate situations and lead to accidents.",
    category: "Attitude"
  },

  // Accidents and Emergencies
  {
    id: 75,
    question: "What should you do first at the scene of an accident?",
    options: [
      "Call the police immediately",
      "Move injured people away from vehicles",
      "Warn other traffic and make the area safe",
      "Take photographs for insurance"
    ],
    correctAnswer: 2,
    explanation: "First, warn other traffic by switching on hazard lights and placing a warning triangle if available.",
    category: "Accidents"
  },
  {
    id: 76,
    question: "What is the emergency number in the UK?",
    options: ["111", "999 or 112", "101", "911"],
    correctAnswer: 1,
    explanation: "The emergency number in the UK is 999. You can also use 112, which works across Europe.",
    category: "Accidents"
  },
  {
    id: 77,
    question: "When should you remove a motorcyclist's helmet after an accident?",
    options: [
      "Immediately",
      "Only if they are not breathing",
      "Never remove it",
      "If they are unconscious"
    ],
    correctAnswer: 1,
    explanation: "Only remove a helmet if the casualty is not breathing and you need to perform CPR. Otherwise, leave it on to protect the spine.",
    category: "Accidents"
  },
  {
    id: 78,
    question: "What information should you exchange after an accident?",
    options: [
      "Only your name",
      "Name, address, and insurance details",
      "Only insurance details",
      "Phone numbers only"
    ],
    correctAnswer: 1,
    explanation: "Exchange names, addresses, vehicle details, and insurance information with the other party involved.",
    category: "Accidents"
  },
  {
    id: 79,
    question: "When must you report an accident to the police?",
    options: [
      "Only if someone is injured",
      "If you did not exchange details at the scene",
      "Only if there is major damage",
      "Accidents never need to be reported"
    ],
    correctAnswer: 1,
    explanation: "You must report the accident to the police within 24 hours if you didn't exchange details at the scene or if anyone was injured.",
    category: "Accidents"
  },

  // Environmental Issues
  {
    id: 80,
    question: "How can you reduce fuel consumption?",
    options: [
      "Use higher gears at low speeds",
      "Accelerate harshly",
      "Avoid harsh acceleration and maintain steady speed",
      "Keep windows open at high speeds"
    ],
    correctAnswer: 2,
    explanation: "Smooth acceleration, maintaining a steady speed, and avoiding unnecessary braking can significantly reduce fuel consumption.",
    category: "Environment"
  },
  {
    id: 81,
    question: "What is eco-safe driving?",
    options: [
      "Driving as fast as possible",
      "Driving in a way that saves fuel and reduces emissions",
      "Only driving electric cars",
      "Driving only on motorways"
    ],
    correctAnswer: 1,
    explanation: "Eco-safe driving involves driving smoothly, anticipating the road ahead, and maintaining your vehicle to reduce fuel use and emissions.",
    category: "Environment"
  },
  {
    id: 82,
    question: "Why should you avoid idling your engine unnecessarily?",
    options: [
      "It improves engine performance",
      "It wastes fuel and causes pollution",
      "It is good for the engine",
      "It has no effect"
    ],
    correctAnswer: 1,
    explanation: "Idling wastes fuel and produces unnecessary emissions. Switch off if you're stationary for more than a minute or two.",
    category: "Environment"
  },
  {
    id: 83,
    question: "How does proper tyre pressure help the environment?",
    options: [
      "It doesn't affect the environment",
      "Correct pressure reduces fuel consumption",
      "Lower pressure is better for fuel economy",
      "It only affects tyre wear"
    ],
    correctAnswer: 1,
    explanation: "Correctly inflated tyres reduce rolling resistance, improving fuel economy and reducing emissions.",
    category: "Environment"
  },

  // Parking
  {
    id: 84,
    question: "What does a single yellow line mean?",
    options: [
      "No parking at any time",
      "Parking restrictions apply at certain times",
      "Parking for residents only",
      "Free parking at all times"
    ],
    correctAnswer: 1,
    explanation: "A single yellow line means parking restrictions apply at certain times. Check nearby signs for specific times.",
    category: "Parking"
  },
  {
    id: 85,
    question: "What does a double yellow line mean?",
    options: [
      "No waiting at any time",
      "Waiting allowed for loading",
      "Parking for disabled drivers only",
      "Residents parking only"
    ],
    correctAnswer: 0,
    explanation: "Double yellow lines mean no waiting at any time. Loading may be permitted unless there are also loading restrictions.",
    category: "Parking"
  },
  {
    id: 86,
    question: "How close to a junction can you park?",
    options: [
      "5 metres",
      "10 metres",
      "15 metres",
      "As close as you like"
    ],
    correctAnswer: 1,
    explanation: "Do not park within 10 metres of a junction. This ensures visibility for all road users.",
    category: "Parking"
  },
  {
    id: 87,
    question: "When should you switch off your engine while parked?",
    options: [
      "Never",
      "Only in parking garages",
      "When stationary for more than a minute or two",
      "Only in winter"
    ],
    correctAnswer: 2,
    explanation: "Switch off your engine when parked to reduce emissions and save fuel, especially if stationary for more than a minute.",
    category: "Parking"
  },

  // Night Driving
  {
    id: 88,
    question: "At night, you should be able to stop within what distance?",
    options: [
      "The distance you can see ahead",
      "50 metres",
      "100 metres",
      "Any distance"
    ],
    correctAnswer: 0,
    explanation: "You should always be able to stop within the distance you can see - this is the distance illuminated by your headlights.",
    category: "Night Driving"
  },
  {
    id: 89,
    question: "What should you do if dazzled by an oncoming vehicle's headlights?",
    options: [
      "Flash your headlights back",
      "Look at the road ahead",
      "Slow down or stop if necessary",
      "Switch to full beam"
    ],
    correctAnswer: 2,
    explanation: "If dazzled, slow down or stop if necessary. Avoid looking directly at the oncoming lights.",
    category: "Night Driving"
  },
  {
    id: 90,
    question: "When following another vehicle at night, what should you do?",
    options: [
      "Use full beam headlights",
      "Use dipped headlights",
      "Use fog lights",
      "Use sidelights only"
    ],
    correctAnswer: 1,
    explanation: "Use dipped headlights when following another vehicle to avoid dazzling them in their mirrors.",
    category: "Night Driving"
  },

  // Dual Carriageways
  {
    id: 91,
    question: "What is the purpose of a rumble strip on a dual carriageway?",
    options: [
      "To slow you down",
      "To indicate a junction ahead",
      "To alert you if you drift out of your lane",
      "To separate traffic"
    ],
    correctAnswer: 2,
    explanation: "Rumble strips create noise and vibration to alert drivers if they drift out of their lane, helping prevent accidents.",
    category: "Dual Carriageways"
  },
  {
    id: 92,
    question: "What should you do before moving into the right-hand lane on a dual carriageway?",
    options: [
      "Sound your horn",
      "Check mirrors and signal",
      "Just signal",
      "Speed up"
    ],
    correctAnswer: 1,
    explanation: "Before changing lanes, check your mirrors, signal, and check your blind spot before moving.",
    category: "Dual Carriageways"
  },

  // Rural Roads
  {
    id: 93,
    question: "What hazards should you expect on country roads?",
    options: [
      "Only slow tractors",
      "Pedestrians, cyclists, animals, and slow vehicles",
      "No hazards",
      "Only horse riders"
    ],
    correctAnswer: 1,
    explanation: "Country roads may have pedestrians without pavements, cyclists, horse riders, farm animals, and slow agricultural vehicles.",
    category: "Rural Roads"
  },
  {
    id: 94,
    question: "What should you do when meeting oncoming traffic on a narrow country road?",
    options: [
      "Keep going, they will stop",
      "Be prepared to stop or give way",
      "Flash your headlights",
      "Sound your horn"
    ],
    correctAnswer: 1,
    explanation: "Be prepared to stop or give way. Pull into a passing place on your left if necessary.",
    category: "Rural Roads"
  },
  {
    id: 95,
    question: "Why are country roads particularly dangerous?",
    options: [
      "They have fewer traffic lights",
      "They are wider than town roads",
      "They often have hidden bends and limited visibility",
      "There are no speed limits"
    ],
    correctAnswer: 2,
    explanation: "Country roads often have hidden bends, limited visibility, and unexpected hazards like farm vehicles or animals.",
    category: "Rural Roads"
  },

  // Signalling
  {
    id: 96,
    question: "When should you signal?",
    options: [
      "Only when other vehicles are present",
      "In plenty of time before changing direction",
      "Only at junctions",
      "After you have started to turn"
    ],
    correctAnswer: 1,
    explanation: "Signal in plenty of time before any change of direction or speed to warn other road users of your intentions.",
    category: "Signalling"
  },
  {
    id: 97,
    question: "What should you do if your signal misleads other road users?",
    options: [
      "Keep signalling",
      "Cancel your signal",
      "Ignore them",
      "Speed up"
    ],
    correctAnswer: 1,
    explanation: "If your signal might mislead others, cancel it. Incorrect signals can cause confusion and accidents.",
    category: "Signalling"
  },
  {
    id: 98,
    question: "What does flashing headlights mean according to the Highway Code?",
    options: [
      "I am giving you priority",
      "I am here, be aware of my presence",
      "Speed up",
      "Thank you"
    ],
    correctAnswer: 1,
    explanation: "The only official meaning of flashing headlights is to alert others to your presence. Never assume it means 'go ahead'.",
    category: "Signalling"
  },

  // Lane Discipline
  {
    id: 99,
    question: "What is the left-hand lane of a motorway for?",
    options: [
      "Overtaking only",
      "Normal driving",
      "Slow vehicles only",
      "Lorries only"
    ],
    correctAnswer: 1,
    explanation: "The left-hand lane is for normal driving. Use the other lanes only for overtaking.",
    category: "Lane Discipline"
  },
  {
    id: 100,
    question: "What is 'lane hogging' and why is it dangerous?",
    options: [
      "Staying in the left lane too long",
      "Staying in the middle or right lane when the left lane is clear",
      "Driving slowly in any lane",
      "Changing lanes frequently"
    ],
    correctAnswer: 1,
    explanation: "Lane hogging is staying in the middle or right lane when the left lane is clear. It causes congestion and can lead to dangerous undertaking.",
    category: "Lane Discipline"
  }
];
