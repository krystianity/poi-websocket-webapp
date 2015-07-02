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
this class is a wrapper for the L.map object and makes it easier
to set its view, add features and popups to it, as well as getting the
current geo location of the device 
the most simple setup would look like:

	map = new mapObj("map", "map_e", true);
	map.getGEO(function(latlon){
		map.setGEO(latlon, 15);
	});

afterall, for websocketserver connection, there is a class 
called ioMap that combines socketIO with mapObj and uses the
map object inside of itself.
*/

function mapObj(mapElement, errorElement, standardMap) {
	
	mapObj.prototype.errorField = errorElement;
	mapObj.prototype.mapElement = mapElement;

	this.map = null;
	if(standardMap)
		this.createStandardMap();
	
    this.popupOptions =
        {
            'minWidth': '180',
            'minHeight': '180',
            'closeButton': true
        };

    this.markers = [];
};

function appendError(_str) {
	$("#" + mapObj.errorElement).html($("#" + mapObj.errorElement).html() + "<p>" + _str + "</p>");
};

function log(_str) {
	console.log("log-mapObj: " + _str);
};

mapObj.prototype.getGEO = function(callback) {
	var scope = this;
	if(navigator.geolocation){
		log("getGEO, HTML5 navigator enabled");
		navigator.geolocation.getCurrentPosition(function(pos){
			scope.onGEOLocation(pos, callback);
		}, this.onGEOLocationError);
	} else {
		log("getGEO, bad browser");
		appendError("Geolocation is not supported by this browser.");
		return [0, 0];
	}
};

mapObj.prototype.setGEO = function(latlon, zoom){
	this.map.setView(latlon, zoom);
};

mapObj.prototype.onGEOLocation = function(position, callback){
	log("getGEO, no error occured");
	callback([position.coords.latitude, position.coords.longitude]);
};

mapObj.prototype.onGEOLocationError = function(error) {
	log("getGEO, error occured " + error.code);
	switch(error.code) {
		case error.PERMISSION_DENIED:
			appendError("User denied the request for Geolocation.");
			break;
		case error.POSITION_UNAVAILABLE:
			appendError("Location information is unavailable.");
			break;
		case error.TIMEOUT:
			appendError("The request to get user location timed out.");
			break;
		case error.UNKNOWN_ERROR:
			appendError("An unknown error occurred.");
			break;
		default:
			appendError("Default error " + error.code);
			break;
	}
};

mapObj.prototype.createStandardMap = function(callback){
	this.map = L.map(mapObj.prototype.mapElement);

	//attach copyright footer to map area
	L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'examples.map-i875mjb7'
	}).addTo(this.map);
};

mapObj.prototype.addSimplePopup = function(poi_id, latlon, innerElement, oc_cb, im_scope, strict_open){
	strict_open = typeof strict_open === "undefined" ? false : strict_open;

	var m = L.marker(latlon).addTo(this.map);
	var popup = L.popup(this.popupOptions).setContent(innerElement);
	m.bindPopup(popup);
	
	m.on('click', function(e){
		var ims = im_scope;
		oc_cb(e, ims);
	});
	
	m._poi_id = poi_id; //add a custome field to the markers

    this.markers.push(m); //add to marker list
	
	if(strict_open)
		m.openPopup();
};

mapObj.prototype.deleteAllMarkers = function() {
    console.log("deleting " + this.markers.length + " markers..");
    for(var i = 0; i < this.markers.length; i++){
      this.map.removeLayer(this.markers[i]);
    }

    this.markers = []; //reset
};

mapObj.prototype.deletePopup = function(marker) {
    this.map.removeLayer(marker);
};

mapObj.prototype.deleteMarkerById = function(id) {
	for(var i = 0; i < this.markers.length; i++) {
		if(this.markers[i]._poi_id == id){
			this.map.removeLayer(this.markers[i]);
			break;
		}
	}
};

mapObj.prototype.addComplexClickPopup = function(callback){
	var popup = L.popup();
	function onMapClick(e){
		callback(popup, e);
	}
	this.map.on('click', onMapClick);

	/* example usage:
	io.map.addComplexClickPopup(function(popup, e){
		popup
			.setLatLng(e.latlng)
			.setContent("You clicked the map at " + e.latlng.toString())
			.openOn(io.map);
	});
	*/
};

mapObj.prototype.addCircle = function(latlon, size, _color, innerElement, _fillColor, _fillOpacity){
	if(typeof _fillColor === 'undefined')
		_fillColor = "#f03";
	if(typeof _fillOpacity === 'undefined')
		_fillOpacity = 0.5;

	L.circle(latlon, size, {
		color: _color,
		fillColor: _fillColor,
		fillOpacity: _fillOpacity
	}).addTo(this.map).bindPopup(innerElement);
};

mapObj.prototype.addPoly = function(p1, p2, p3, innerElement){
	L.polygon([p1, p2, p3]).addTo(this.map).bindPopup(innerElement);
};

mapObj.prototype.setOnMapClickEvent = function(func, scope){
	this.map.on('click', function(e){
		func(scope, e);
	});
};

mapObj.prototype.setOnPopupcloseEvent = function(func, scope) {
	this.map.on("popupclose", function(e) {
		func(scope, e);
	});
};

mapObj.prototype.setOnPopupopenEvent = function(func, scope) {
	this.map.on("popupopen", function(e) {
		func(scope, e);
	});
};

mapObj.prototype.setOnPanMovementEvent = function(func, scope){

    this.map.on('zoomend', function(e){
        func(scope, e);
    });

    this.map.on('dragend', function(e){
        func(scope, e);
    });
};

mapObj.prototype.getCenter = function() {
    return this.map.getCenter();
};

mapObj.prototype.getZoom = function() {
    return this.map.getZoom();
};