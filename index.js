const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 8000;

app.listen(port, () => console.log(`TPL Matchmaking Server listening at http://localhost:${port} ...`));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDb Localhost
// mongoose.connect("mongodb://127.0.0.1:27017/tpl-matchmaking", {                             // Connecting to MongoDb Server
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => {
//     console.log("MongoDB Database Conncted ...");
// });

// MongoDb Atlas

mongoose.connect("mongodb+srv://phoenix:tpl@cluster0.vtaen.mongodb.net/tpl-matchmaking?retryWrites=true&w=majority", {// Connecting to MongoDb Server
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB Database Conncted ...");
});
app.get("/", (req, res) => { res.send("Welcome to TPL Matchmaking Server ... ('This is a root Path')") })

const GameSchema = new mongoose.Schema({ 
    name: String,                                           // User Schema
    waitlist: Array,
	gamesledger: Array
});

const GameModel = new mongoose.model('Games', GameSchema);                          // User Model

app.post('/creategame', async (req, res) => {
	let data = {
		name: req.body.name,
		waitlist: [],
		gamesledger: []
	}
    let newGame = new GameModel(data);
	newGame.save().then(() => {
		res.send("Game Created");
	}).catch((err) => {
		res.send(err);
});

});

app.get('/player-game=:game&player=:player', async (req, res) => {
	let data = await GameModel.findOne({name: req.params.game});
	
	let tempwaitlist = data.waitlist;
	const generateGameId = () => {
		return(Math.floor(100000 + Math.random() * 900000));
	}
	if (tempwaitlist.length) {
		let gameid = tempwaitlist[0];
		tempwaitlist.splice(0);
		let newgameledger = data.gamesledger;
		let tempvar = 0;
		let gameindex = await newgameledger.map((value) => {
			if (value.gameid == gameid) {
				return(tempvar);
			}
			tempvar+=1;
		
		});
		newgameledger[gameindex[0]].player2 = req.params.player;
		let newgamedata = await GameModel.findOneAndUpdate({name: req.params.game}, {waitlist: tempwaitlist}, { new: true });
		newgamedata = await GameModel.findOneAndUpdate({name: req.params.game}, {gamesledger: newgameledger}, { new: true });
		res.send(newgameledger[gameindex[0]]);


	} else {
		// res.send("Added to Waitlist");

		gameid = generateGameId();
		tempwaitlist.push(gameid);
		let newgameledger = data.gamesledger;
		newgame = {
			gameid: gameid,
			player1: req.params.player,
			player2: "",
			p1_score: "",
			p2_score: ""
		}
		newgameledger.splice(0, 0, newgame);
		let newgamedata = await GameModel.findOneAndUpdate({name: req.params.game}, {gamesledger: newgameledger}, { new: true });
		newgamedata = await GameModel.findOneAndUpdate({name: req.params.game}, {waitlist: tempwaitlist}, { new: true });
		let counter = 5000;
		while (counter != 0) {
			counter += 1;
			let newdata = await GameModel.findOne({name: req.params.game});
			let findgameledger = newdata.gamesledger;
			let tempvar = 0;
			let findindex = await findgameledger.map((value) => {
														if (value.gameid == gameid) {
															return(tempvar);
														}
														tempvar+=1;
													
													});
			if (findgameledger[findindex[0]].player2 != "") {
				res.send(findgameledger[findindex[0]]);
			}
		}


	}
});


app.post('/updatescore', async (req, res) => {

	let data = await GameModel.findOne({name: req.body.game});
	let gameid = req.body.gameid;
	let newgameledger = data.gamesledger;
	let gameindex = 0;
	for (let i = 0; newgameledger.length; i++ ){
		if (newgameledger[i].gameid == gameid) {
			gameindex = i;
			break;
		}
	}
	if (newgameledger[gameindex].player1 == req.body.player) {
		newgameledger[gameindex].p1_score = req.body.p_score;
		newgamedata = await GameModel.findOneAndUpdate({name: req.body.game}, {gamesledger: newgameledger}, { new: true });
		res.send("Score Added")
	} else if (newgameledger[gameindex].player2 == req.body.player){
		newgameledger[gameindex].p2_score = req.body.p_score;
		newgamedata = await GameModel.findOneAndUpdate({name: req.body.game}, {gamesledger: newgameledger}, { new: true });
		res.send("Score Added")
	} else {
		res.send("Player/Game Not Found").statusCode(404)
	}
});

app.get('/getresult-game=:game&gameid=:gameid', async (req, res) => {

	let data = await GameModel.findOne({name: req.params.game});
	let gameid = req.params.gameid;
	let newgameledger = data.gamesledger;
	let gameindex = 0;
	for (let i = 0; newgameledger.length; i++ ){
		if (newgameledger[i].gameid == gameid) {
			gameindex = i;
			break;
		}
	}

	if (newgameledger[gameindex].p1_score > newgameledger[gameindex].p2_score) {
		res.send({
			result: newgameledger[gameindex].player1
		})
	} else if (newgameledger[gameindex].p1_score < newgameledger[gameindex].p2_score) {
		res.send({
			result: newgameledger[gameindex].player2
		})
	} else {
		res.send({
			result: "Draw"
		})
	}

});