global.fs = require('fs');
global.config = JSON.parse(fs.readFileSync('config.json'));
var mc = require('minecraft-protocol');
global.color = require("ansi-color").set;
var states = mc.states;
global.util = require('util');

global.jsdom = require("jsdom");
global.textTable = require('text-table');

var redisLib = require("redis");
global.redis = redisLib.createClient();

require('./js/functions.js');
require('./js/info.js');
require('./js/chat.js');
require('./js/basics.js');
require('./js/money.js');
require('./js/mail.js');

function connect(){
	function timeout(){
		console.log('Time Out');
		process.exit();
	}
	var timeoutkill = -1;
	//players = {};
	global.client = mc.createClient(config.client);
	
	

	client.on('kick_disconnect', function(packet) {
		console.log('Kicked for ' + packet.reason);
		process.exit();
	});
	
	client.on('connect', function() {
		console.log('connected');
	});
	
	client.on('login',function(){
		chat.say('hello world');
		chat.command('tps');
	});
	
	client.on('keep_alive',function(){
		clearTimeout(timeoutkill);
		timeoutkill = setTimeout(timeout,config.timeout);
	});
	
	client.on('disconnect', function(packet) {
		console.log('disconnected: '+ packet.reason);
		process.exit();
	});
	
	client.on('end', function() {
		console.log("Connection lost");
		process.exit();
	});
	
	client.on('error', function(err) {
		console.log('err',err);
		process.exit();
	});
	
	client.on('update_health', function(packet){
		if(packet.health <= 0)client.write('client_command',{action_id:0});
	});
	
	client.on('player_info',playerInfo);
	
	client.on('chat',chatInput);
}

connect();

process.on('uncaughtException', function(err) {
    console.log(err.stack)
});
