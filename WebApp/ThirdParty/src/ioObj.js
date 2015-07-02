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

/* 
this class is a very light wrapper for socketio
hoever it is indicated to be used in the ioMap class 
to make enable websocket-map-action support
*/
function ioObj(url){
	this.url = url;
	//this.socket = null;
	this.callbacks = [];
	
	var scope = this;
	setTimeout(function(){
		console.log("Bound callbacks after init: " + scope.callbacks.length);
	}, 2000);
};

ioObj.prototype.connect = function(){
	//this.socket = io.connect(this.url);
};

ioObj.prototype.send = function(p_type, data){
	//if(typeof data === 'undefined') data = "null";
	//this.socket.emit(p_type, data);
	
	var scope = this;
	console.log("post send: " + p_type + " - " + data);
	simple_proxy_request(this.url, p_type, data, function(err, res) {
		console.log("proxy response: err= " + err + ", content: " + res);
		
		if(err)
			res = [];
		else
			if(isJSON(res))
				res = JSON.parse(res);
		
		for(var i = 0; i < scope.callbacks.length; i++){
			if(scope.callbacks[i].type == p_type)
				scope.callbacks[i].cb(res);
		}
		
	});
};

ioObj.prototype.listen = function(p_type, callback){
	//this.socket.on(p_type, function(packet){
		//callback(packet);
	//});
	
	this.callbacks.push({
		type: p_type,
		cb: callback
	});
};