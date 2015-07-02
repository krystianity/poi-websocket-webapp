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

var poi; //database handler
var ios; //socket

var POIDealer = require('./POIDealer.js').POIDealer;
var IOSocket = require('./IOSocket.js').IOSocket;

//tell all clients that the server crashed
process.on('uncaughtException', function(err){
	console.log('an uncaught exception occured ' + err);
	if(ios)
		ios.broadcastError('unexpected server error');
});

//close database if the server exists (wont work due to async probably)
process.on('exit', function(code){
	if(poi)
		poi.shutdown(function(){});
});

poi = new POIDealer(function(){
	ios = new IOSocket(3535, function(){
		ios.receiveEvents([
		{
			emit: "getDefaultLocation",
			evt: function(client, packet){
				//client.con.emit('getDefaultLocation', '[50.990876, 7.130548]');
				client.con.emit('getDefaultLocation', '[50.914373, -1.403669]');
				poi.getPOICount(function(err, res){ //broadcast updated amount of pois
					client.con.emit("bc_poisTotal", res);
				});
			}
		},
		{
			emit: "addPoi",
			//addPoi packets have to be broadcasted
			evt: function(client, packet){
				poi.addNewPOI(packet, function(err, res){
					if(res){
						console.log('added new poi: ' + res);
						client.con.emit('addPoi', res);
						
						packet.ID = res; //make a valid poi for the other users (lat, lon and id are min. req)
						ios.broadcast(client.id, "bc_addPoi", packet);
						
						poi.getPOICount(function(err, res){ //broadcast updated amount of pois
							ios.broadcast(-1, "bc_poisTotal", res);
						});
						
					} else {
						console.log('failed to add new poi ' + err);
						client.con.emit('addPoi', false);
					}
				});
			}
		},
		{
			emit: "removePoi",
			//removePoi packets have to be broadcasted
			evt: function(client, packet){
				poi.removePOIFromId(packet, function(changes){
                    if(changes == 1) {
                        console.log('poi was removed from the database');
						
						ios.broadcast(-1, "bc_removePoi", packet);
						
						poi.getPOICount(function(err, res){ //broadcast updated amount of pois
							ios.broadcast(-1, "bc_poisTotal", res);
						});
						
						client.con.emit('removePoi', packet); //still needed for Proxy
						
                    } else {
                        console.log('failed to remove poi from the database');
                        client.con.emit('removePoi', false);
                    }
				});
			}
		},
		{
			emit: "changePoi",
			//changePoi packets have to be broadcasted
			//although it is not really critical because onMarkerClick downloads the full poi details every time again
			evt: function(client, packet){
				poi.changePOI(packet, function(changes){
					if(changes == 1){
						console.log('successfully changed a poi');
						client.con.emit('changePoi', true);
						
						ios.broadcast(client.id, "bc_changePoi", packet);
						
					} else {
						console.log('failed to change a poi');
						client.con.emit('changePoi', false);
					}
				});
			}
		},
		{
			emit: "getPoi",
			evt: function(client, packet){
				poi.getPOIFromId(packet, function(err, res){
					if(res){
						console.log('got poi');
						client.con.emit('getPoi', res);
					} else {
						console.log('failed to get poi ' + err);
						client.con.emit('getPoi', false);
					}
				});	
			}
		},
		{
			emit: "getAllShorts",
			evt: function(client, packet){
				poi.getAllPOIsShort(function(err, res){
					if(res){
						console.log('sending a list of shortened pois');
						client.con.emit('getAllShorts', res);
					} else {
						console.log('couldnt get a list of shortened pois');
						client.con.emit('getAllShorts', []);
					}
				});
			}
		},
        {
            emit: "getReviews",
            evt: function(client, packet){
                poi.getReviewsForPoi(packet, function(err, res){
                    if(res){
                        console.log('sending a list of reviews for poi ' + packet);
                        client.con.emit('getReviews', res);
                    } else {
                        console.log('couldnt get a list of reviews for poi ' + packet);
                        client.con.emit('getReviews', []);
                    }
                });
            }
        },
        {
            emit: "addReview",
            evt: function(client, packet){
                poi.addReview(packet, function(err, res){
                    if(res){
                        console.log('added a new review');
                        client.con.emit('addReview', res);
                    } else {
                        console.log('failed to add a new review');
                        client.con.emit('addReview', false);
                    }
                });
            }
        },
        {
            emit: "getShorts",
            evt: function(client, packet){
                poi.getFilteredPOIsShort(packet, function(err, res){
                    if(res){
                        console.log('sending a list of local shortened pois');
                        client.con.emit('getShorts', res);
                    } else {
                        console.log('couldnt get a list of local shortened pois');
                        client.con.emit('getShorts', []);
                    }
                });
            }
        },
        {
            emit: "getAutoCompletes",
            evt: function(client, packet){

                var call = null;
                switch(packet.autoType){
                    case "type": call = poi.getAllTypes; break;
                    case "name": call = poi.getAllNames; break;
                    case "region": call = poi.getAllRegions; break;
                    case "country": call = poi.getAllCountries; break;
                    default:
                        client.con.emit('getAutoCompletes', []);
                        console.log("unknown autoType: " + packet.autoType);
                        return;
                }

                call(packet.autoValue, function(err, res){
                    if(res){
                        console.log('sending a list of auto completes for ' + packet.autoType);
                        client.con.emit('getAutoCompletes', res);
                    } else {
                        console.log("couldn't get a list of auto completes for " + packet.autoType);
                        client.con.emit('getAutoCompletes', []);
                    }
                });
            }
        },
		{
            emit: "authenticate",
            evt: function(client, packet){
				poi.getUserIdFromCredentials(packet.user, packet.password, function(err, res) {
					if(res && res.length > 0) {
						ios.setAuth(client.id);
						client.con.emit("authenticate", true);
					} else {
						client.con.emit("authenticate", false);
					}
				});
            }
        }
		]);
	});
});