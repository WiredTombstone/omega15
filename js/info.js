global.players = {};
global.started = false;
global.omegaCount = 0;

global.getUUID = function(name){
	name = name.toLowerCase();
	for(var i in players){
		var player = players[i];
		if(player.name.toLowerCase() == name)return player.UUID;
	}
}


global.databaseUUID = function(name,callback){
	if(isUUID(name)){
		callback(name);
		return;
	}
	
	var uuid = getUUID(name);
	
	if(uuid){
		callback(uuid);
		return;
	}
	
	redis.get('uuid:' + name.toLowerCase(),function(err,reply){
		callback(reply);
	});
}

global.databaseName = function(uuid,callback){
	redis.get('name:'+uuid,function(err,reply){
		callback(reply);
	});
}

global.isAdmin = function(name){
	return config.admins.indexOf(getUUID(name)) != -1;
}

global.playerInfo = function(packet){
	if(packet.action == 0){ //join
		for(var i in packet.data){
			var player = packet.data[i];
			players[player.UUID] = player;
			if(player.name == client.username)omegaCount++
			join(player);
			if(omegaCount == 2)started = true;
		}
	}else if(packet.action == 4){//leave
		for(var i in packet.data){
			var player = packet.data[i];
			leave(player);
			delete players[player.UUID];
		}
	}else if(packet.action == 2){
		for(var i in packet.data){
			var player = packet.data[i];
			players[player.UUID].ping = player.ping;
		}
	}
}

var leaveJoinUpdates = 0;

function jlSpam(name,joined,message){
	leaveJoinUpdates++;
	setTimeout(function(){
		leaveJoinUpdates--;
	},config.leaveJoinFilter.time)
	if(leaveJoinUpdates <= config.leaveJoinFilter.max){
		chat.highlight(name + (joined ? ' joined': ' left') + ' the game. '+ (message ? '(' + message + ')' : ''));
		if(joined)commands['mail']({
			name: name,
			text: '',
			begin: true,
			pm: function(text){
				chat.pm(this.name,text);
			}
		});
	}
}

function join(player){
	redis.set('uuid:' + player.name.toLowerCase(), player.UUID);
	redis.set('name:' + player.UUID, player.name);
	redis.set('seen:' + player.UUID, +new Date());
	redis.setnx('balance:' + player.UUID,config.startBalance,function(err,reply){
		if(!reply)return ;
		for(var i in config.admins){
			addBalance(config.admins[i],config.adminPay);
		}
		
	});
	if(!started)return;

	redis.get('joinMessage:' + player.UUID, function(err,reply){
		jlSpam(player.name, true, reply);
	});
}

function leave(player){
	var name = players[player.UUID].name;
	redis.get('leaveMessage:' + player.UUID, function(err,reply){
		jlSpam(name, false, reply);
	});
}
