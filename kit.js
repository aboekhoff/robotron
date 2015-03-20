function Game() {

}

// setup information that will not change from state to state

Game.init = function() {
	this.numTypes  = get_number_of_item_types();
	this.tie       = this.numTypes / 2;
	this.win       = this.tie + 0.5;
	this.fruits    = [];
	this.typeMasks = [];

	for (var t=0; t<this.numTypes; t++) {
		typeMasks[t] = 0;
	}

	// store bitmasks that identify all fruits of every type

	var board = get_board();
	for (var x=0; x<board.length; x++) {
		for (var y=0; y<board[0].length; y++) {
			var type = board[x][y];
			if (type) {
				var realtype = type - 1;
				var id = this.fruits.length;
				var fruit = {
					type: realtype,
					x: x,
					y: y,
					id: id
				};
				this.fruits.push(fruit);
				this.typeMasks[realtype] &= (1 << id);
			}
		}
	}

};