TYPES = ['APPLE', 'BANANA', 'CHERRY', 'MELON', 'ORANGE'];

function new_game() {
	window.firstMove = true;
}

function make_move() {
	var items = [];
	var types = [];
	var board = get_board();
	for (var x = 0; x < board.length; x++) {
		for (var y = 0; y < board[0].length; y++) {
			var t = board[x][y];
			if (t > 0) {
				types[t-1] || (types[t-1] = []);
				types[t-1].push({
					x: x, y: y, type: t-1
				});
			}
		}
	}

	var hero = {
		x: get_my_x(),
		y: get_my_y()
	};

	var villain = {
		x: get_opponent_x(),
		y: get_opponent_y()
	};

	var totals = [];
	var heroCounts = [];
	var villainCounts = [];

	types.forEach(function(type, index) {
		var total = totals[index] = get_total_item_count(index+1);
		var tie = total/2;
		var hc = heroCounts[index] = get_my_item_count(index+1);
		var vc = villainCounts[index] = get_opponent_item_count(index+1);
		if (hc > tie || vc > tie || (hc == tie && vc == tie)) {
			type.length = 0;
		}
	});

	var best = -Infinity;
	var targets = [];

	if (window.firstMove) {
		types.forEach(function(type) {
			type.forEach(function(item, index) {
				var ntypes = types.slice();
				ntypes[item.type] = type.slice();
				ntypes[item.type].splice(index, 1);

				var ncounts = heroCounts.slice();
				ncounts[item.type] += 1;

				var penalty = distance(hero, item) + 1;

				var score = evgame(item, villain, ntypes, totals, heroCounts, villainCounts, penalty);
				console.log(score, item);
				if (score > best) {
					best = score;
					targets = [item];
				} else if (score == best) {
					targets.push(item);
				}
			});
		});
	}

}

function evgame(hero, villain, types, totals, heroCounts, villainCounts, penalty) {
	var gameTotal = types.length;
	var gameTie = gameTotal / 2;
	var disputedTypes = [];

	var hs = 0;
	var vs = 0;

	for (var i=0; i<types.length; i++) {
		var total = totals[i],
			tie = total/2,
			hc = heroCounts[i],
			vc = villainCounts[i];
		if (hc > tie) {
			hs += 1;
		} 
		else if (vc > tie) {
			vs += 1;
		} 
		else if (hc === 0 && vc === 0) {
			hs += 0.5;
			vs += 0.5;
		}
		else {
			disputedTypes.push(i);
		}
	}

	// try to short circuit before expensive domination calculations are invoked;
	if (hs > gameTie) { return Infinity; }
	if (vs > gameTie) { return -Infinity; }
	if (hs === gameTie && vs === gameTie) { return 0; }

	var hfuzzy = hs;
	var vfuzzy = vs;

	for (var i=0; i<disputedTypes.length; i++) {
		var t = disputedTypes[i];
		var items = types[t];
		var total = totals[t];
		var tie   = total/2;
		var hc = heroCounts[t];
		var vc = villainCounts[t];
		var res = ev(hero, villain, items, hc, vc, penalty);

		var ths = hs;
		var tvs = vs;

		if (res.score === 0) {
			ths += 0.5; 
			tvs += 0.5; 
		}

		if (res.score === 1) {
			ths += 1;
			hfuzzy += 0.5;
		}

		if (res.score === -1) {
			tvs += -1;
			vfuzzy += 0.5;
		}

		if (ths > gameTie) { return 1; }
		if (tvs > gameTie) { return 1; }
		if (ths == gameTie && tvs == gameTie) { return 0; }
	}

	return hfuzzy - vfuzzy;

}

function distance(a, b) {
	return Math.abs(b.x-a.x) + Math.abs(b.y-a.y);
}

function byDistanceTo(x) {
	return function(a, b) {
		var da = distance(x, a);
		var db = distance(x, b);
		return da < db ? -1 : db < da ? 1 : 0;
	};
}

function compare(a, b) {
	return a < b ? -1 : b < a ? 1 : 0;
}

function ev1(hero, villain, items, heroCount, villainCount, penalty) {
	console.log('EV 1');
	console.log(hero, villain, items, heroCount, villainCount, penalty);
	return ev(hero, villain, items, heroCount, villainCount, penalty);
}

function ev(hero, villain, items, heroCount, villainCount, penalty) {

	var total = heroCount + villainCount + (items ? items.length : 0);
	var tie = total/2;
	var res = {
		target: hero,
		score: null
	};

	if (heroCount > tie) {
		res.score = 1;
		return res;
	}

	if (villainCount > tie) {
		res.score = -1;
		return res;
	}

	if (heroCount === tie && villainCount === tie) {
		res.score = 0;
		return res;
	} 

	if (hero.x === villain.x && hero.y === villain.y) {
		res.score = heroCount > villainCount ? 1 : villainCount > heroCount ? -1 : 0;
		return res;
	}

	var near  = [];
	var far   = [];
	var equal = [];
			
	items.forEach(function(item) {
		var hd = distance(hero, item);
		var vd = distance(villain, item);
		var rd = vd - (hd + penalty); 

		if (rd > 0) {
			near.push(item);
		} else if (rd < 0) {
			far.push(item);
		} else {
			equal.push(item);
		}
	});

	// covers cases where all items are equidistant
	if (far.length === 0 && heroCount > villainCount) {
		res.score = 1;
		return res;
	}

	if (near.length === 0 && villainCount > heroCount) {
		res.score = -1;
		return res;
	}

	best = null;

	// scan near items 
	var cur, item, index, nitems, tmp;
	cur = near.sort(byDistanceTo(hero));

	for (var i=0; i<cur.length; i++) {
		item = cur[i];
		index = items.indexOf(item);
		nitems = items.slice(); nitems.splice(index, 1);
		tmp = ev(item, villain, nitems, heroCount + 1, villainCount, penalty + distance(hero, item) + 1);

		if (!best || tmp.score > best.score) {
			best = tmp;
			if (best.score === 1) { return best; } 
		}
	}

	// scan far items
	cur = far.sort(byDistanceTo(villain));

	for (i=0; i<cur.length; i++) {
		item = cur[i];
		index = items.indexOf(item);
		nitems = items.slice(); nitems.splice(index, 1);
		// swap hero and villain, heroCount and villainCount, and negate penalty
		tmp = ev(item, hero, nitems, villainCount + 1, heroCount, (-penalty) + distance(villain, item) + 1);
		// negate the evaluation
		tmp.score *= -1;

		if (!best || tmp.score > best.score) {
			best = tmp;
			if (best.score === 1) { return best; } 
		}
	}

	cur = equal.sort(byDistanceTo(hero));

	for (i=0; i<cur.length; i++) {
		item = cur[i];
		index = items.indexOf(item);
		nitems = items.slice(); nitems.splice(index, 1);
		var split = ev(item, item, nitems, heroCount+0.5, villainCount+0.5, 0);
		var taken = ev(item, villain, nitems, heroCount+1, villainCount, distance(hero, item) + 1);
		tmp = split.score < taken.score ? split : taken;

		// we already explore all alternatives where take an equidistant item
		// we explore all alternatives where we take a closer item
		// the enemy has the opportunity to capture it in other branches

		if (!best || tmp.score > best.score) {
			best = tmp;
			if (best.score === 1) { return best; } 
		}
	}	

	return best;

}