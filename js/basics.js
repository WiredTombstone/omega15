var urban = require('urban');
var wordnet = require("wordnet");
var parseString = require('xml2js').parseString;
global.request = require('request');
var quran = require('quran');

commands['help'] = function(data){
	data.respond(config.help);
}

commands['ud'] = function(data){
	if(data.text == '')return ;
	
	urban(data.text).first(function(json) {
		if(!json){
			data.respond(data.text+': I don\'t know.');
			return;
		}
		data.respond(json.word + ': ' + json.definition);
	});
}

commands['d'] = function(data){
	if(data.text == '')return ;
	
	wordnet.lookup(data.text, function(err, definitions) {
		if(err){
			data.respond(data.text+': I don\'t know.');
			return;
		}
		data.respond(data.text + ': ' + definitions[0].glossary);
	});
}

commands['seen'] = function(data){
	if(data.text == '')return ;
	
	databaseUUID(data.text,function(uuid){
		redis.get('seen:' + uuid,function (err, reply){
			data.respond(reply === null ? 'I\'ve never seen ' + data.text : 'I seen ' + data.text + ', '+ timeSince(reply)+' ago.');
		});
	});
}

commands['uuid'] = function(data){
	if(data.text == '')return ;	
	data.respond(data.text + ': ' + getUUID(data.text));
}

commands['players'] = function(data){
	data.respond('There are currenctly '+ Object.keys(players).length + ' players online.');
}

commands['wolf'] = function(data){
	if(data.text == '')return ;
	
	var url = 'http://api.wolframalpha.com/v2/query?input=' + encodeURIComponent(data.text)+'&appid=' + encodeURIComponent(config.wolframalpha);
	request(url, function (err, response, body) {
		if (!err && response.statusCode != 200)return;
		parseString(body, xml);
	});
	
	function xml(err, result) {
		var pods = result.queryresult.pod
		
		for(var i in pods){
			var pod = pods[i];
			if(i == 1){
				data.respond(data.text+ ': ' + pod.subpod[0].plaintext[0]);
				return;
			}
		}
	}
}
commands['wiki'] = function(data){
	var url = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=' + encodeURIComponent(data.text);
	request(url, function (err, response, body) {
		if (!err && response.statusCode != 200)return;
		var pages = JSON.parse(body).query.pages;
		var page = pages[Object.keys(pages)[0]];
		data.respond(page.title + ': ' + page.extract);
	});
}
commands['q'] = function(data){
	
	function spam(err,verses) {
		if(err)return;
		var verse = randomArray(verses);
		data.respond(verse.chapter + ':' + verse.verse + ', ' + verse.en);
	}
	
	if(data.text == ''){		
		quran.search('en','',spam);
		return;
	}

	var parts = data.text.split(' ').join(':').split(':');
	quran.select({ chapter: parts[0], verse: [ parts[1] ]},{language: 'en'}, spam);
}

commands['execute'] = function(data){
	chat.highlight('Shall Allah execute ' + data.text + '? /kill yes or /kill no to vote.');
}

commands['vote'] = function(data){
	chat.highlight(data.name + ' has voted.');
}

commands['tps'] = function(data){
	data.respond('TPS: '+ tps);
}

commands['ping'] = function(data){
	var player = players[getUUID(data.text || data.name)];
	if(player)data.respond(player.name+ ': ' + player.ping +'ms');
}

commands['sjm'] = function(data){
	redis.set('joinMessage:' + getUUID(data.name), data.text)
	data.respond(data.name + ': Join message set.');
}

commands['slm'] = function(data){
	redis.set('leaveMessage:' + getUUID(data.name), data.text)
	data.respond(data.name + ': Leave message set.');
}
