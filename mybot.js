function new_game() {   
}

function make_move() {
   var game = Game.create();
   var states = dumbass(game);

   console.log(states);

   var move = states[0][0].hero;

   console.log('target = x: ' + move.x + ', y: ' + move.y);
   console.log('evaluation is: ' + states[0][0].evaluate());

   if (move.x != game.hero.x) {
      return move.x < game.hero.x ? WEST : EAST;
   }

   if (move.y != game.hero.y) {
      return move.y < game.hero.y ? NORTH : SOUTH;
   }

   else {
      return TAKE;
   }
}

Game.extend({
   candidatesFor: function(playerKey) {
      var player = this[playerKey];
      var west  = -Infinity;
      var east  = Infinity;
      var north = -Infinity;
      var south = Infinity;
      var take  = null;

      this.fruits.forEach(function(type) {
         if (type) {
            type.forEach(function(fruit) {
               if (fruit.x < player.x) { 
                  west = Math.max(west, fruit.x);
               }
               if (fruit.x > player.x) { 
                  east = Math.min(east, fruit.x); 
               }
               if (fruit.y < player.y) {
                  north = Math.max(north, fruit.y);
               }
               if (fruit.y > player.y) {
                  south = Math.min(south, fruit.y);
               }
               if (fruit.x === player.x && fruit.y === player.y) {
                  take = true;
               }
            });
         }
      });

      var candidates = [];

      if (east !== Infinity) { 
         candidates.push({x: east, y: player.y});
      }

      if (west !== -Infinity) {
         candidates.push({x: west, y: player.y});
      }

      if (south !== Infinity) {
         candidates.push({x: player.x, y: south});
      }

      if (north !== -Infinity) {
         candidates.push({x: player.x, y: north});
      }

      if (take) {
         candidates.push({x: player.x, y: player.y});
      }

      return candidates;

   },

   evaluate: function() {

      console.log('evaluating', this);

      if (this._evaluation !== null) {
         return this._evaluation;
      }

      var game = this;

      var hs = 0;
      var vs = 0;

      var numTypes = this.totals.length;

      var disputedTypes = [];

      for (var t=0; t < numTypes; t++) {
         var tc  = this.totals[t];
         var tie = tc / 2;
         var win = tie + 0.5;
         var hc  = this.hero.counts[t];
         var vc  = this.villain.counts[t];

         if      (hc >= win) { hs += 1; }
         else if (vc >= win) { vs += 1; }
         else { 
            if (hc == tie) { hs += 0.5; } 
            if (vc == tie) { vs += 0.5; }
            if (hc != tie || vc != tie) {
               disputedTypes.push(t);
            }
         }
      }

      var gameTie = numTypes / 2;
      var gameWin = gameTie + 0.5;

      if (hs >= gameWin) { return this._evaluation = Infinity; }
      if (vs >= gameTie) { return this._evaluation = -Infinity; }
      if (hs == gameTie && vs == gameTie) { return this._evaluation = 0; }
      
      // fuzzy evaluation

      // only tie possible?
      
      var hg, vg;

      if (vs == gameTie) {
         hg = gameTie - hs;
         vg = 0.5;
      } 

      else if (hs == gameTie) {
         hg = 0.5;
         vg = gameTie - vs;
      }
      
      else {
         hg = gameWin - hs;
         vg = gameWin - vs;
      }

      // don't worry about ties yet

      hg = Math.ceil(hg);
      vg = Math.ceil(vg);

      
      var hpaths = [],
          vpaths = [];

      disputedTypes.forEach(function(t) {
         var tc   = this.totals[t];
         var goal = Math.ceil(tc/2 + 0.5);
         hpaths.push(Path.shortest(this.hero, Math.ceil(goal-this.hero.counts[t]), this.fruits[t]));
         vpaths.push(Path.shortest(this.villain, Math.ceil(goal-this.villain.counts[t]), this.fruits[t]));
      }.bind(this));

      [hpaths, vpaths].forEach(function(paths) {
         paths.sort(function(a, b) {
            return compare(a[0].cost, b[0].cost);
         });
      });

      function sumPathCosts(paths, goal) {
         var sum = 0;
         for (var i=0; i<goal; i++) {
            var path = paths[i][0];
            sum += path.cost;
         }
         return sum;
      }

      var he = sumPathCosts(hpaths, hg);
      var ve = sumPathCosts(vpaths, vg); 
      var fuzzyValue = ve - he;

      return this._evaluation = fuzzyValue;

   }

});

function Path(node, tail, cost, size) {
   this.node = node;
   this.tail = tail;
   this.cost = cost;
   this.size = size;
}

Path.extend({
   add: function(node) {
      return new Path(node, this, this.cost + distance(this.node, node) + 1, this.size + 1);
   }
});
// use bitmask to handle efficient removal of candidates


Path.reopen({
   create: function(node) {
      return new Path(node, null, 0, 1);
   },

   shortest: function(start, goal, candidates) {

      function search(path, goal, candidates, best) {

         if (goal === 0) { return [path]; }

         var res = [];

         candidates.sort(function(a, b) {
            return compare(distance(path.node, a), distance(path.node, b));
         });

         var ncandidates = [];

         for (var i=0, ii=candidates.length; i<ii; i++) {
            ncandidates[i] = [];
            for (var j=0; j<ii; j++) {
               if (j != i) { ncandidates[i].push(candidates[j]); }
            }
         }

         for (i=0; i<ii; i++) {
            var npath = path.add(candidates[i]);
            if (npath.cost > best) { continue; }
            var nres = search(npath, goal-1, ncandidates[i], best);

            if (nres.length === 0) { continue; }

            var ncost = nres[0].cost;

            if (ncost < best) {
               best = ncost;
               res = nres;
            }

            else if (ncost === best) {
               res.push.apply(res, nres);
            }
         }

         return res;

      }

      return search(Path.create(start), goal, candidates, Infinity);

   }
});

// combine hero candidates with villain candidates to create a set of game states
// assign each hero score the minimum evaluation of each combination with the villain states

function dumbass(game) {
   var hc = game.candidatesFor('hero');
   var vc = game.candidatesFor('villain');

   function delta(player, item, amount) {
      if (player.x != item.x) {
         return {
            x: item.x < player.x ? -amount : amount,
            y: player.y
         };
      }

      if (player.y != item.y) {
         return {
            x: player.x,
            y: item.y < player.y ? -amount : amount
         };
      }

      throw Error('no delta');

   }


   var states = [];

   hc.forEach(function(a) {
      var da = distance(game.hero, a);
      var games = [];
      states.push(games);
      vc.forEach(function(b) {
         var db = distance(game.villain, b);
         var _game;

         // split
         if (da === 0 && db === 0) {
            if (a.x === b.x && a.y === b.y) {
               _game = game.split(game.hero);
            } else {
               _game = game.take('hero', a).take('villain', b);
            }
         }

         // 
         else if (da < db) {
            if (da === 0) {
               _game = game.take('hero', a);
            } else {
               _game = game.move('hero', a);
            }

            _game = _game.move('villain', delta(game.villain, b, da));
         }

         else if (db < da) {
            _game = game.move('hero', delta(game.hero, a, db));

            if (db === 0) {
               _game = _game.take('villain', b);
            } else {
               _game = _game.move('villain', b);
            }
         }

         else {
            _game = game.move('hero', a).move('villain', b);
         }

         games.push(_game);

      });

      games.sort(function(a, b) {
         return compare(a.evaluate(), b.evaluate()); 
      });

   });

   states.sort(function(a, b) {
      return compare(b[0].evaluate(), a[0].evaluate());
   });

   return states;

}

// domination

/*

algorithm for selecting goals is as follows:
first group all items by quadrant (left, right, above, below)

*/

