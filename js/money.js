global.getBalance = function(user,callback){
	databaseUUID(user,function(uuid){
		if(!uuid){
			callback(0,false);
			return;
		}
		
		redis.get('balance:' + uuid,function(err, reply){
			callback( reply || 0, true);
		});
	});
}

global.setBalance = function(user,value){
	if(isNaN(value))return;
	
	databaseUUID(user,function(uuid){
		if(!uuid){
			callback(0,false);
			return;
		}
		
		redis.set('balance:' + uuid, Math.floor(value));
	});
}

global.addBalance = function(user,value,callback){
	if(isNaN(value))return;
	
	databaseUUID(user,function(uuid){
		if(!uuid){
			callback(0,false);
			return;
		}
		
		redis.incrby('balance:' + uuid, Math.floor(value),function(err, reply){
			if(callback)callback( reply || 0, true);
		});
	});
}

global.subBalance = function(user,value,callback){
	if(isNaN(value))return;
	
	getBalance(user,function(bal,valid){
		if(!valid || bal - value < 0){
			callback(bal,false);
			return;
		}
		
		addBalance(user,-value,callback);
	});
}

global.transfer = function(from,to,value,callback){
	if(isNaN(value) || value < 0)return;
	
	getBalance(to,function(bal,valid){
		if(!valid){
			callback(false);
			return ;
		}
		
		subBalance(from,value, function(balance,pass){
			if(!pass){
				callback(false);
				return ;
			}
			addBalance(to,value);
			callback(true);
		});
	});

}

global.getAll = function(callback){
	redis.keys('balance:*',function(err, keys){
		var players = {}
		for(var i in keys){
			(function(key){
				var uuid = key.split(':')[1];
				redis.get(key,function(err, balance){
					databaseName(uuid,function(name){
						players[uuid] = {
							balance: balance,
							name: name
						}
						if(Object.keys(players).length == keys.length){
							callback(players);
						}
					});
				});		
			})(keys[i]);
		}
	});
}

commands['bal'] = function(data){
	if(data.text == '')data.text = data.name;
	
	getBalance(data.text, function(balance,valid){
		data.respond(data.text + ': $' + balance.comma());
	});
}


commands['setbal'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length != 2 || !isAdmin(data.name))return;
	setBalance(parts[0],parts[1]);
}

commands['addbal'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length != 2 || !isAdmin(data.name))return;
	addBalance(parts[0],parts[1], function(balance,valid){
		data.respond(parts[0] + ': $' + balance);
	});
}

commands['subbal'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length != 2 || !isAdmin(data.name))return;
	subBalance(parts[0],parts[1], function(balance,pass){
		data.respond(parts[0] + ': $' + balance + ' ' + (pass ? 'passed' : 'failed'));
	});
}

commands['transfer'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length != 3 || !isAdmin(data.name))return;
	transfer(parts[0],parts[1],parts[2], function(pass){
		data.respond(parts[0] + ' -> ' + parts[1] + ': ' + (pass ? 'passed' : 'failed'));
	});
}

commands['pay'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length != 2)return;
	transfer(data.name,parts[0],parts[1].split(',').join(''), function(pass){
		data.respond(data.name + ' -> ' + parts[0] + ': ' + (pass ? 'passed' : 'failed'));
	});
}


commands['topbal'] = function(data){
	getAll(function(players){
		var keys = Object.keys(players);
		keys.sort(function(a, b) {
			return players[b].balance - players[a].balance
		})
		
		keys.splice(50,keys.length);
		var rows = [['Rank','Username','Balance']];
		for(var i in keys){
			
			var player = players[keys[i]];
			rows.push(['#'+(i * 1 +1),player.name,'$' + player.balance.comma()])
		}
		hastebin(textTable(rows),function(url){
			data.respond('Richest People: ' + url);
		});
	})
}



