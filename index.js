const Discord = require('discord.js');
const { In, isSubset } = require("./utils");

const client = new Discord.Client();

let idToGame = {};

class Game {
  constructor(ctx, player1, player2) {
		this.ids = [player1, player2];
		this.players = [[], []];
    this.turn = Math.round(Math.random());
		this.board = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
		this.x = this.ids[this.turn]; 
		this.o = this.ids[(this.turn + 1) % 2];
		this.recap(ctx);
  }

	recap(ctx){
		this.sendMessage(ctx, `${this.x} is X, ${this.o} is O`);
		this.sendMessage(ctx, this.ids[this.turn] + " It's your turn!");
		this.sendBoard(ctx);
	}

	checkBoard() {
		if (this.players[0].length + this.players[1].length == 9) return 2;

		let wins = [[1, 2, 3], [4, 5, 6], [7, 8, 9],
								[1, 4, 7], [2, 5, 8], [3, 6, 9],
								[1, 5, 9], [3, 5, 7]];

		for (let w of wins){
			if (isSubset(this.players[0], w)) return 0;
			if(isSubset(this.players[1], w)) return 1;
		}
		return false;
	}

  sendBoard(ctx) {
    this.sendMessage(ctx, "```" + this.board.map(x => x.join(" | ")).join('\n') + "```");
	}

  sendMessage(ctx, message) {
    ctx.channel.send(message);
  }
  
  nextPlayer() {
    this.turn = (this.turn + 1) % 2;
  }
	
	win(ctx, result) {
		this.sendBoard(ctx);
		if (result == 2) this.sendMessage(ctx, "Tie!");
		else this.sendMessage(ctx, this.ids[result] + " wins!!!");
		return true;
	}

  play(ctx, args, senderId) {
		if (senderId !== this.ids[this.turn]) {
			return this.sendMessage(ctx, "It's not your turn.");
		}
		
    let num = parseInt(args[0]);
    
		if (isNaN(num)) return this.sendMessage(ctx, "That's not a number!");
		if (num < 1 || num > 9) return this.sendMessage(ctx, "Invalid number!");
    
		let row = Math.floor((num - 1) / 3);
		let col = (num - 1) % 3;
		if (In(this.board[row][col], ['X', 'O'])) return this.sendMessage(ctx, "Tile already placed in that position");
		this.board[row][col] = this.x == this.ids[this.turn] ? 'X' : 'O';
		this.players[this.turn].push(num);

		let result = this.checkBoard();
		if (result !== false) return this.win(ctx, result);
		this.nextPlayer();
		this.sendMessage(ctx, this.ids[this.turn] + " It's your turn!");
		this.sendBoard(ctx);

		return false;
  }
}

const prefix = '#';

client.on("ready", () => {
  client.user.setActivity(`${prefix} prefix`);
  console.log("Bot active");
});

client.on("message", msg => {
  if(msg.author.bot || !msg.content.startsWith(prefix)) return;
  
  let message = msg.content.substring(1),
		serverId = msg.guild.id,
    authorId = msg.author.id,
    name = msg.author.username,
    args = message.split(" ").map(v => v.trim()).filter(v => v.length),
    command = args.shift(),
    p1 = '<@!' + authorId + '>';
  
  
  if (command ==  "new") {
		if (serverId in idToGame && authorId in idToGame[serverId]) return msg.channel.send("You're already in a game");

    let p2 = args[0];

    if(p1 == p2) return msg.channel.send("You can't play a match with yourself");
		if (!msg.guild.member(p2.substring(3, p2.length - 1))) return msg.channel.send("Other player doesn't exist");
  
		let newGame = new Game(msg, '<@!' + authorId + '>', p2);
		if (!(serverId in idToGame)) idToGame[serverId] = {};

		idToGame[serverId][p1] = newGame;
		idToGame[serverId][p2] = newGame;
	}
  else if (command == "quit") {
		if (serverId in idToGame && p1 in idToGame[serverId]) {
			let _p1 = idToGame[serverId][p1].ids[0];
			let _p2 = idToGame[serverId][p1].ids[1];
			delete idToGame[serverId][_p1];
			delete idToGame[serverId][_p2];
			msg.channel.send("You quit. Loser. We deleted the game for you >:(");
		}
		else {
			msg.channel.send("Gotta join a game first :)");
    }
  }
  else if (command == "play") {
		if (serverId in idToGame && p1 in idToGame[serverId]) {
			let result = idToGame[serverId][p1].play(msg, args, p1);
			if (result) {
				let _p1 = idToGame[serverId][p1].ids[0];
				let _p2 = idToGame[serverId][p1].ids[1];
				delete idToGame[serverId][_p1];
				delete idToGame[serverId][_p2];
			}
		}
		else {
			msg.channel.send("That user isn't recognized");
		}
	}
	else if (command == "recap") {
		if (serverId in idToGame && p1 in idToGame[serverId]) {
			idToGame[serverId][p1].recap(msg);
		}
	}
	else if (command == "help") {
		msg.channel.send(`Sorry, I am unhelpful. Commands are "new", "play", "recap", and "quit"`);
	}
});

client.login(process.env.DISCORD_AUTH);