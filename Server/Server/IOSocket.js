/*
Copyright 2015 Christian Fröhlingsdorf, 5cf.de

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var antispam = require('socket-anti-spam');

var antispam = new antispam({
    spamCheckInterval: 3000,
    spamMinusPointsPerInterval: 3,
    spamMaxPointsBeforeKick: 120,
    spamEnableTempBan: true,
    spamKicksBeforeTempBan: 3,
    spamTempBanInMinutes: 10,
    removeKickCountAfter: 1,
    debug: false
});

function IOSocket(port, callback){
	this.clients = [];

	app.use(function(req, res, next) {
  		res.header("Access-Control-Allow-Origin", "*");
  		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  		next();
	});

	app.get('/', function(req, res){ 
		res.end('this service is not ment to be used as (GET) http service.'); 
	});

	app.post('/', function(req, res, next) {
 		res.end('this service is not ment to be used as (POST) http service.');
	});

	app.put('/', function(req, res){ 
		res.end('this service is not ment to be used as (PUT) http service.'); 
	});

	app.delete('/', function(req, res, next) {
 		res.end('this service is not ment to be used as (DELETE) http service.');
	});

	http.listen(port, function(){
		console.log('WebSocket active using HttpServer on localhost@' + port);
		callback();
	});
};

IOSocket.prototype.broadcastError = function(msg){
	console.log("broadcast emitting error " + msg);
	for(var i = this.clients.length - 1; i >= 0; i--){
		this.clients[i].con.emit('serror', msg);
	}
};


IOSocket.prototype.removeClient = function(id){
	console.log("deleting client " + id);
	for(var i = this.clients.length - 1; i >= 0; i--){
		if(this.clients[i].id === id){
			this.clients.splice(i, 1);
			this.broadcast(-1, "bc_clientsTotal", this.clients.length);
			break;
		}
	}
};

IOSocket.prototype.broadcast = function(cid, type, content) {
	console.log("broadcast emitting to " + (this.clients.length - 1) + " clients.");
	for(var i = this.clients.length - 1; i >= 0; i--){
		if(this.clients[i].id != cid || cid == -1) {
			this.clients[i].con.emit(type, content);
		}
	}
};

IOSocket.prototype.setAuth = function(cid) {
	console.log("client " + cid + " authentificated himself.");
	for(var i = this.clients.length - 1; i >= 0; i--){
		if(this.clients[i].id != cid) {
			this.clients[i].authentificated = true;
			break;
		}
	}
};

IOSocket.prototype.receiveEvents = function(eventRef){
	var parent = this;
	io.on('connection', function(socket){
	
		antispam.onConnect(socket); //prevent the live server from being killed in spam
	
		var conId = parent.connections;
		IOSocket.prototype.connections++;
		
		console.log("new client connected " + conId);
		
		var client = {
			id : conId,
			con : socket,
			authentificated : false
		};

		parent.clients.push(client);

		socket.on('disconnect', function(){
			parent.removeClient(conId);
		});

		for(var i = 0; i < eventRef.length; i++){
			
			var f = function()
			{
				return function(i)
				{
					socket.on(eventRef[i].emit, function(packet){
						eventRef[i].evt(client, packet); 
					});
				}
			}

			f()(i);
			/* passing the refernces through the client event functions
			as an array and assigning them in a loop brings up the 'closure problem'
			which requires the instantiation of another closure that returns a closure
			right during every loop, giving 'i' a valid scope during every loop.
			this took a while to figure out, because of the fact that the closure, of whichs
			scope is instantiated during the loop, has to carry another event listener.
			09.12.2014 */
		}
		
		parent.broadcast(-1, "bc_clientsTotal", parent.clients.length);
	});
};

IOSocket.prototype.connections = 0;

exports.IOSocket = IOSocket;