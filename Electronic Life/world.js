"use strict";


/** Vector constructor
  */
function Vector(x,y){
	this.x = x;
	this.y = y;
}
Vector.prototype.plus = function(vector){
	return new Vector(this.x + vector.x, this.y + vector.y);
}


/** Grid constructor
  */
function Grid(width, height){
	this.space = new Array(width * height);
	this.width = width;
	this.height = height;
}
// check if vector is inside the grid
Grid.prototype.isInside = function(vector){
	return (vector.x >= 0 && vector.x < this.width && vector.y >= 0 && vector.y < this.height);
}

// get value at the vector position
Grid.prototype.get = function(vector){
	return this.space[vector.x + this.width * vector.y];
}

// set the value at vector position
Grid.prototype.set = function(vector, value){
	this.space[vector.x + this.width * vector.y] = value;
}

// call function f for each grid element
Grid.prototype.forEach = function(f, context){
	for(var y=0; y < this.height; ++y){
		for(var x=0; x < this.width; ++x){
			var value = this.space[x + y * this.width];
			if(value != null){
				// call f for each element
				f.call(context, value, new Vector(x, y));
			}
		}
	}
}


// directions of movement
var directions = {
	"n":  new Vector( 0, -1),
  	"ne": new Vector( 1, -1),
  	"e":  new Vector( 1,  0),
  	"se": new Vector( 1,  1),
  	"s":  new Vector( 0,  1),
  	"sw": new Vector(-1,  1),
	"w":  new Vector(-1,  0),
	"nw": new Vector(-1, -1)
};

// helper function - returns random element from the given array
function randomElement(array) {
	return array[Math.floor(Math.random() * array.length)];
}

var directionNames = "n ne e se s sw w nw".split(" ");


/** Bouncing critter constructor
  */
function BouncingCritter() {
	this.direction = randomElement(directionNames);
};
BouncingCritter.prototype.act = function(view) {
	// check if empty space is available in the set direction
	if (view.look(this.direction) != " ") {
		this.direction = view.find(" ") || "s";
	}

	return {
		type: "move",
		direction: this.direction
	};
};


// creates an element from character
function elementFromChar(legend, ch) {
	if (ch == " ") return null;
  	var element = new legend[ch]();
  	element.originChar = ch;
	return element;
}

// returns element's corresponding character
function charFromElement(element){
	if(element == null) {
		return " ";	
	} else {
		return element.originChar;
	}
}


/** World constructor
  */
function World(map, legend) {
	
	var grid = new Grid(map[0].length, map.length);
	this.grid = grid;
	this.legend = legend;

	// set up grid elements based on the given map
	map.forEach(function(line, y) {
		for (var x = 0; x < line.length; x++){
			let element = elementFromChar(legend, line[x]);
			grid.set(new Vector(x, y), element); // set objects in the grid
		}
	});
}

// returns string representation of the world
World.prototype.toString = function(){
	var output = '';
	for(var y=0; y < this.grid.height; ++y){
		for(var x=0; x < this.grid.width; ++x){
			var element = this.grid.get(new Vector(x,y));
			output += charFromElement(element);
		}
		output += "\n";
	}
	return output;
};

// draw world in the browser
World.prototype.draw = function(){
	for(var y = 0; y < this.grid.height; ++y){
		for(var x = 0; x <  this.grid.width; ++x){
			var element = this.grid.get(new Vector(x,y));
			var char = charFromElement(element);
			var div = document.createElement('div');
			var txt = document.createTextNode(char);
			div.appendChild(txt);
			div.style.left = 30 * x + 'px';
			div.style.top = 30 * y + 'px';
			document.body.appendChild(div);
		}
	}
};


// make a move
World.prototype.turn = function(){

	var acted = [];
	this.grid.forEach(function(critter, vector){
		if(critter.act && acted.indexOf(critter) == -1){
			acted.push(critter);
			this.letAct(critter, vector);
		}
	}, this);

};


World.prototype.letAct = function(critter, vector){

	var action = critter.act(new View(this, vector));

	if (action && action.type == "move") {
		var dest = this.checkDestination(action, vector);
		if (dest && this.grid.get(dest) == null) {
			this.grid.set(vector, null);
			this.grid.set(dest, critter);
		}
	}
};


World.prototype.checkDestination = function(action, vector) {
	if (directions.hasOwnProperty(action.direction)) {
		var dest = vector.plus(directions[action.direction]);
		if(this.grid.isInside(dest)) return dest;
	}
};


/** View constructor
  */
function View(world, vector){
	this.world = world;
	this.vector = vector;
}
// look in the given direction
View.prototype.look = function(dir){
	var target = this.vector.plus(directions[dir]);
	if(this.world.grid.isInside(target)){
		return charFromElement(this.world.grid.get(target));
	}
	return '#';
};
// find all directions in which there are given characters
View.prototype.findAll = function(ch){
	var found = [];
	for(var dir in directions){
		if(this.look(dir) == ch){
			found.push(dir);
		}
	}
	return found;
};
// find random direction in which there is given character
View.prototype.find = function(ch){
	var found = this.findAll(ch);
	if(found.length == 0) return null;
	return randomElement(found);
};

// Wall is just a simple object and has no methods
function Wall() {}

// direction arithmetics
function dirPlus(dir, n){
	var index = directionNames.indexOf(dir);
	return directionNames[(index + n + 8) % 8];
}

/** Wall follower type of critter
  */
function WallFollower(){
	this.dir = 's';
}
WallFollower.prototype.act = function(view) {
	
	var start = this.dir;

	if (view.look(dirPlus(this.dir, -3)) != " "){
		start = this.dir = dirPlus(this.dir, -2);
	}
	
	while (view.look(this.dir) != " ") {
		this.dir = dirPlus(this.dir, 1);
		if (this.dir == start) break;
	}
	return { type: "move", direction: this.dir };
};



// world legend
var legend = {
	'#' : Wall,
	'o' : BouncingCritter,
	'~' : WallFollower,
};

// inital world set up
var plan = ["############################",
            "# ~    #    #      o       #",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #    ~#",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                    ~#",
            "############################"];

// create world
var world = new World(plan, legend);


// run!
setInterval(function(){
	document.body.innerHTML = "";
	world.turn();
	world.draw();
}, 200);