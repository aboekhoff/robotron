if (typeof window == 'undefined') { 
	require('./util.js');
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

// test

Array.prototype.remove = function(object) {
	var index = this.indexOf(object);
	if (index != -1) {
		var ret = this.slice();
		ret.splice(index, 1);
		return ret;
	} else {
		return this;
	}
};

function test1() {
	Game.tie = [0.5, 1.5, 2.5];
	var items = [];

	function pushItems(type, num) {
		while (num) {
			items.push({
				x: items.length, 
				y: items.length, 
				type: type
			});
			num--;
		}
	}

	pushItems(0, 1);
	pushItems(1, 3);
	pushItems(2, 5);

	var h = new Player(0, 0, [0, 0, 0], 0, 'hero');
	var v = new Player(0, 0, [0, 0, 0], 0, 'villain');
	var g = new Game(h, v, items);

	console.log(g);

	g = g.takeHero(g.items[0]);

	console.log(g);

	g = g.takeHero(g.items[0]);
	g = g.takeVillain(g.items[0]);

	console.log(g);

	g = g.split(g.items[0]);

	console.log(g);

	g = g.takeHero(g.items[0]);
	g = g.takeHero(g.items[0]);

	console.log(g);

	g = g.split(g.items[0]);

	console.log(g);

	g = g.split(g.items[0]);

	console.log(g);

	g = g.takeHero(g.items[0]);

	console.log(g);

}

if (typeof window == 'undefined') {
	test1();	
}
