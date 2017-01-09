//var tr = require('tor-request');

var colors = {
	"black": 'black',
	"dark_blue": 'blue',
	"dark_green": 'green',
	"dark_aqua": 'cyan',
	"dark_red": 'red',
	"dark_purple": 'magenta',
	"gold": 'yellow',
	"gray": 'black+white_bg',
	"dark_gray": 'black+white_bg',
	"blue": 'blue',
	"green": 'green',
	"aqua": 'cyan',
	"red": 'red',
	"light_purple": 'magenta',
	"yellow": 'yellow',
	"white": 'white',
	"obfuscated": 'blink',
	"bold": 'bold',
	"strikethrough": '',
	"underlined": 'underlined',
	"italic": '',
	"reset": 'white'
}

var dictionary = {
	"chat.stream.emote": "(%s) * %s %s",
	"chat.stream.text": "(%s) <%s> %s",
	"chat.type.achievement": "%s has just earned the achievement %s",
	"chat.type.admin": "[%s: %s]",
	"chat.type.announcement": "[%s] %s",
	"chat.type.emote": "* %s %s",
	"chat.type.text": "<%s> %s"
}

global.parseChat = function(chatObj, parentState) {
	function getColorize(parentState) {
		var myColor = "";
		if('color' in parentState) myColor += colors[parentState.color] + "+";
		if(parentState.bold) myColor += "bold+";
		if(parentState.underlined) myColor += "underline+";
		if(parentState.obfuscated) myColor += "obfuscated+";
		if(myColor.length > 0) myColor = myColor.slice(0, -1);
		return myColor;
	}

	if(typeof chatObj === "string") {
		return color(chatObj, getColorize(parentState));
	} else {
		var chat = "";
		if('color' in chatObj) parentState.color = chatObj['color'];
		if('bold' in chatObj) parentState.bold = chatObj['bold'];
		if('italic' in chatObj) parentState.italic = chatObj['italic'];
		if('underlined' in chatObj) parentState.underlined = chatObj['underlined'];
		if('strikethrough' in chatObj) parentState.strikethrough = chatObj['strikethrough'];
		if('obfuscated' in chatObj) parentState.obfuscated = chatObj['obfuscated'];

		if('text' in chatObj) {
			chat += color(chatObj.text, getColorize(parentState));
		} else if('translate' in chatObj && dictionary.hasOwnProperty(chatObj.translate)) {
			var args = [dictionary[chatObj.translate]];
			chatObj['with'].forEach(function(s) {
				args.push(parseChat(s, parentState));
			});

			chat += color(util.format.apply(this, args), getColorize(parentState));
		}
		if (chatObj.extra) {
			chatObj.extra.forEach(function(item) {
				chat += parseChat(item, parentState);
			});
		}
		return chat;
	}
}

global.timeSince = function(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

global.isUUID = function (str){
	return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str); 
}

var jquery = fs.readFileSync("./js/jquery.js");

global.getUrlTitle = function(url,callback){
	tr.request(url, function (err, res, body) {
		if (err || res.statusCode != 200){
			callback();
			return;
		}
		
		jsdom.env({
			html:body,
			src: [jquery],
			done: function (err, window) {
				callback(window.$("title").html());
			}
		});
	});
}

global.getRandom = function(low, high) {
	return ~~(Math.random() * (high - low)) + low;
}

global.randomArray = function(a){
	return a[getRandom(0,a.length)];
}

Number.prototype.comma = function(){
	return this.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

String.prototype.comma = function(){
	return this.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

global.hastebin = function(text,callback){
	request({
		url: 'https://hastebin.com/documents',
		method: 'POST',
		body: text
	}, function(err, response, body) {
		callback(err ? '' : 'https://hastebin.com/raw/' + JSON.parse(body).key)
	});
}
