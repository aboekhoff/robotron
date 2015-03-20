// how to effectively represent the game state?
// it is computationally ineffective to consider 
// every single path
// instead it is better to represent some sort of goal

// for example:
// at each stage of the search
// we assign one player a current goal
// and an associated cost for that goal
// also it is not sufficient to only move to fruits
// since there could arise situations where an advantage
// in mobility enables the winning plan to be adapted
// to the opponents strategy
// therefore we do want to consider intermediary game states.

// so, at each phase of the search we should calculate a small number 
// of reasonable moves.
// a reasonable move is any move that gets closer to one or more fruits.
// that means that at each branch we will only consider up to 5 branches
// i.e., a move in any direction that approaches a fruit, or possibly taking the fruit 
// if that option is available.
// 
//  game state could be represented as follows:
//  {
//  	board: ~,
//  	fruits: ~,
//  	score: ~,
//  	player1: ~,
//  	player2: ~
//  } 
//
// search state could a combination of:
// {
//    game: game,
//    goalPlayer1: ~,
//    goalPlayer2: ~, 
// }

// for each goal combination calculate an intermediate 
// game state that clears the balance

