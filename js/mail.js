var dateFormat = require('dateformat');

commands['mail'] = function(data){
	redis.hgetall('mail:' + getUUID(data.name),function(err,messages){
		var messages = messages || {};
		var mail = {};
		
		if(Object.keys(messages).length == 0){
			if(!data.begin)data.pm('Mail: none');
		}
		
		for(var i in messages){
			var message = JSON.parse(messages[i]);
			(function(from,message){
				databaseName(from,function(name){
					mail[name] = message;
					if(Object.keys(messages).length == Object.keys(mail).length)output();
				});
			})(i,message);
		}
		
		function output(){
			var rows = [['From','Date','Message']];
			for(var i in mail){
				var mess = mail[i];
				rows.push([i, dateFormat(new Date(mess.date), "m/d/yy h:MM:ss TT"), mess.message]);
			}
			
			hastebin(textTable(rows),function(url){
				data.pm('Mail: ' + url);
			});
		}
	})
}

commands['sendmail'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length < 2)return ;
	var name = name = parts[0];
	databaseUUID(name,function(uuid){
		if(!uuid){
			data.respond(data.name + ' -> ' + name + ': User not in database.');
			return;
		}
		parts.splice(0, 1);
		redis.hmset('mail:' + uuid, getUUID(data.name), JSON.stringify({
			date: +new Date(),
			message: parts.join(' ')
		}));
		data.respond(data.name + ' -> ' + name + ': Mail sent.');
	});
}

commands['clearmail'] = function(data){
	redis.del('mail:' + getUUID(data.name));
	data.respond('Mail Cleared.');
}

commands['delmail'] = function(data){
	databaseUUID(data.text,function(uuid){
		redis.hdel('mail:' + getUUID(data.name),uuid);
		data.respond('Mail Deleted.');
	});
}

