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

var express = require('express');
var app = express();
var middleware = require("body-parser");
var http = require('http').Server(app);
var io = {};

function IOProxyServer(socket_server, port, callback){
	var scope = this;

	io = require('socket.io-client')(socket_server);
	
	io.on("connect", function() {

		app.use(middleware.urlencoded());
		app.use(middleware.json());
	
		app.use(function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			next();
		});

		app.get('/*', function(req, res){
			res.end('Please use POST requests only to speak to this proxy!');
		});

		app.post('/*', function(req, res, next) {
			
		    //ECMA 5 check if object is empty  === {}
			if(Object.keys(req.body).length === 0){
				var err = {error: "The request should look the following: proxy=STRING_ACTION&delivery=JSON_DATA"};
				res.end(JSON.stringify(err));
				return;
			}
		
			if(!req.body.proxy || typeof req.body.proxy === 'undefined'){
				var err = {error: "Your missing something! -> proxy=STRING_ACTION <- only parameters 'proxy' and 'delivery' are supported!"};
				res.end(JSON.stringify(err));
				return;
			}
			
			scope.awaitEmit(req.body.proxy, function(data) {
			
				if(typeof data !== 'string')
					data = JSON.stringify(data);
					
				res.end(data);
				
			}, req.body.delivery);
			
		});

		app.put('/*', function(req, res){ 
			res.end('Please use POST requests only to speak to this proxy!'); 
		});

		app.delete('/*', function(req, res, next) {
			res.end('Please use POST requests only to speak to this proxy!');
		});

		http.listen(port, function(){
			console.log('Proxy active on localhost@' + port);
			callback();
		});
	});
};

//this function makes it possible to do awaited-one-time-emits with socketio.
IOProxyServer.prototype.awaitEmit = function(event, _cb, dobj) {

		if(this.isJSON(dobj))
			dobj = JSON.parse(dobj);
			
		console.log("POST->Socket: " + event + ", content: " + JSON.stringify(dobj));

		var cb = null;
		var called = false;
		
		cb = function(res) {
			if(!called){
				called = true;
				console.log("Socket->POST: " + event + ", content: " + JSON.stringify(res));
				_cb(res);
				io.removeListener(event, cb);
			} else {
				console.log("After Proxy-Timeout Response from the service for event: " + event);
				//io.removeListener(event, cb);
			}
		};
		
		//register and fire event
		io.on(event, cb);
		io.emit(event, dobj);
		
		//safety timeout
		setTimeout(function() {
			if(!called){
				called = true;
				_cb(JSON.stringify({error: "Request timeout; between proxy and service!", reason: "The action '" + event + "' is not a valid action!"}));
				console.log("Proxy-Timeout for event: " + event);
				io.removeListener(event, cb);
			}
		}, 5555);
};

//simple function that checks if var is a valid JSON string
IOProxyServer.prototype.isJSON = function(str){
	
	if(str === "" || str === " " || str === null || typeof str === "undefined")
		return false;

    try {
        var obj = JSON.parse(str);
        if (obj && typeof obj === "object" && obj !== null) {
            return true;
        }
    }
    catch (e) { }

    return false;
};

exports.IOProxyServer = IOProxyServer;