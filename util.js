// prototype extensions come first

Function.prototype.extend = function(props) {
	for (var key in props) {
		this.prototype[key] = props[key];
	}
	return this;
};

Function.extend({
	reopen: function(props) {
		for (var key in props) {
			this[key] = props[key];
		}
		return this;
	},

	toComparator: function() {
   		if (!this.comparator) { 
      		var f = this.valueOf();
      		this.comparator = function(a, b) {
         		return compare(f(a), f(b)); 
      		}; 
   		}
   		return this.comparator;
	}
});

String.extend({
	toComparator: function() {
   		var key = this.valueOf();
   		if (!String.comparators[key]) {
      		String.comparators[key] = function(a, b) {
         		return compare(a[key], b[key]); 
      		};
   		}
   		return String.comparators[key];
	}
});

Array.extend({
	sortBy: function(criteria) {
   		var comparator = criteria.toComparator();
   		this.sort(function(a, b) {
      		return comparator(a, b);
   		});
   	},

   	addTo: function(index, value) {
		var arr = this.slice();
		arr[index] = (arr[index] || 0) + value;
		return arr;
	},

	setIndex: function(index, value) {
		var arr = this.slice();
		arr[index] = value;
		return value;
	},

	take: function(n) {
		return this.slice(n);
	}

});

Number.extend({
	eachBit: function(f) {
		var n = this.valueOf();
		var i = 0;
		while(n) {
			var m = n & 1;
			f(i, n);
			i++; 
			n = n >> 1;
		}
	},

	setBit: function(index) {
		return this.valueOf() | (1 << index);
	},

	unsetBit: function(index) {
		return this.valueOf() & ~(1 << index);
	}
});

function compare(a, b) {
   return a < b ? -1 : b < a ? 1 : 0;
}

function distance(a, b) {
   return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

function distanceTo(a) {
   return function(b) {
      return distance(a, b);
   };
}

function Player(x, y, counts, score, name) {
	this.x = x;
	this.y = y;
	this.counts = counts;
	this.score = score;
	this.name = name;
}

Player.extend({
	move: function(to) {
		return new Player(
			to.x,
			to.y,
			this.counts,
			this.score,
			this.name
		);
	},

	take: function(item) {
		var type = item.type;
		var counts = this.counts;
		var ncounts = counts.slice(); ncounts[item.type] += 1;
		var nscore = this.score;

		if (ncounts[type] > Game.tie[type]) {
			if (counts[type] < Game.tie[type]) {
				nscore += 1;
			} else if (counts[type] === Game.tie[type]) {
				nscore += 0.5;
			}
		} 

		else if (ncounts[type] === Game.tie[type]) {
			nscore += 0.5;
		}

		return new Player(
			item.x,
			item.y,
			ncounts,
			nscore,
			this.name
		);

	},

	split: function(item) {
		var type = item.type;
		var counts = this.counts;
		var ncounts = counts.slice(); ncounts[item.type] += 0.5;
		var nscore = this.score;

		if (counts[type] === Game.tie[type] - 0.5 || 
			counts[type] === Game.tie[type]) {
			nscore += 0.5;
		}

		return new Player(
			item.x,
			item.y,
			ncounts,
			nscore,
			this.name
		);
	}
});

Player.reopen({

});

function Game(hero, villain, items) {
	this.hero = hero;
	this.villain = villain;
	this.items = items;
}

Game.extend({
	split: function(item) {
		return new Game(
			this.hero.split(item),
			this.villain.split(item),
			this.items.remove(item)
		);
	},

	takeHero: function(item) {
		return new Game(
			this.hero.take(item),
			this.villain,
			this.items.remove(item)
		);
	},

	moveHero: function(to) {
		return new Game(
			this.hero.move(to),
			this.villain,
			this.items
		);
	},

	takeVillain: function(item) {
		return new Game(
			this.hero,
			this.villain.take(item),
			this.items.remove(item)
		);
	},

	moveVillain: function(to) {
		return new Game(
			this.hero,
			this.villain.move(to),
			this.items
		);
	},

	flip: function() {
		return new Game(
			this.villain,
			this.hero,
			this.items
		);
	}

});

Game.reopen({
	init: function() {
		Game.tie.length = get_number_of_item_types();
		for (var i=0; i<Game.tie.length; i++) {
			Game.tie[i] = get_total_item_count(i+1) / 2;
		}
	},

	tie: []
});

/*

// Everything below is are API commands you can use.
// This, however, is not the actual API that's on the server
// but rather a working model of it for the purposes of giving
// you an environment to develop and debug in.

// don't rely on these constants to be the exact value listed here
var EAST = 1;
var NORTH = 2;
var WEST = 3;
var SOUTH = 4;
var TAKE = 5;
var PASS = 6;

var HEIGHT;
var WIDTH;

function has_item(i) {
    return i > 0;
}

function get_board() {
    return Board.board;
}

function get_number_of_item_types() {
    return Board.numberOfItemTypes;
}

function get_my_x() {
    return Board.myX;
}

function get_my_y() {
    return Board.myY;
}

function get_opponent_x() {
    return Board.oppX;
}

function get_opponent_y() {
    return Board.oppY;
}

function get_my_item_count(type) {
    return Board.myBotCollected[type-1];
}

function get_opponent_item_count(type) {
    return Board.simpleBotCollected[type-1];
}

function get_total_item_count(type) {
    return Board.totalItems[type-1];
}

function trace(mesg) {
    console.log(mesg);
}

 */