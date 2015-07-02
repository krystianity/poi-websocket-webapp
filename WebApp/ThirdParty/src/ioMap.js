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
this class combines the socket.io wrapper ioObj.js and the L.map wrapper,
actually it takes their initialised object references to use them and make 
server set actions easier and run them straight on the mapoobject itself.
the most simple setup would probably look like this:
var io = new ioMap(
	new mapObj("map", "map_e", true), 
	new ioObj('http://localhost:3535'), 
	true);

io.setToDefaultServerLocation();
*/

///constructor
///
function ioMap(map_o, io_o, standard){
	this.io = io_o;
	this.map = map_o;

	this.io.connect();
	if(standard)
		this.registerStandardPacketTypes();

	this.map.setOnMapClickEvent(this.OnMapClickEvent, this);
    this.map.setOnPanMovementEvent(this.OnMapPanningEvent, this);
	this.map.setOnPopupcloseEvent(this.OnPopupCloseEvent, this);
	this.map.setOnPopupopenEvent(this.OnPopupOpenEvent, this);

    //current filter that might apply to markers
    this.filterClass = "type";
    this.filterValue = "*";
    this.onAutoCompleteEvent = null; //to be set externally
	
	this.editNextPoi = false; //used on addPoi()
    this.editMode = false; //if user is working in popup (no markers will be reloaded)
    ioMap.prototype.currentMarker = null; //static
    ioMap.prototype.currentPoi = null; //static
};

///add all socket.io listeners (ioObj) that will trigger functions on server calls
///
ioMap.prototype.registerStandardPacketTypes = function() {
    //context
	var scope = this;

	//sets mapObj to current server default location
	this.io.listen('getDefaultLocation', function(packet){
		if(isJSON(packet)) packet = JSON.parse(packet);
		scope.map.setGEO(packet, 15);
	});

    //adds a list of markers to the map
	this.io.listen('getShorts', function(packet){
	
        scope.map.deleteAllMarkers(); //clear first

		var ie = '';
		for(var i = 0; i < packet.length; i++){
            //id ist later read by onMarkerClick to identify the poi
			ie = '<div class="poi_marker" poi_id="' + packet[i].ID + '"></div>';
			scope.map.addSimplePopup(packet[i].ID, [packet[i].lat, packet[i].lon], ie, scope.onMarkerClick, scope);
		}
	});

	this.io.listen('getPoi', function(packet){
		scope.updateMarkerContent(packet);
	});

    this.io.listen('addPoi', function(packet){
        scope.addPOI(packet);
    });

    this.io.listen('removePoi', function(packet){
        scope.doMarkerRemove(packet);
    });

    this.io.listen('changePoi', function(packet){
        if(packet){
            alert("POI was saved!");
        } else {
            alert("Oups! Couldn't save POI! Please try again!");
        }
    });

    this.io.listen('getReviews', function(packet){
        scope.doMarkerReviews(packet);
    });

    this.io.listen('addReview', function(packet) {
        scope.doMarkerSaveReview(packet);
    });

    //takes care of updating the auto complete array for the search bar
    this.io.listen('getAutoCompletes', function(packet) {

        var fix = [];
        for(var i = 0; i < packet.length; i++){
            fix.push(packet[i][scope.filterClass]);
        }

        if(typeof scope.onAutoCompleteEvent != "undefined") {
           scope.onAutoCompleteEvent(fix);
        }
    });

};

///handler to register the on auto complete event
///
ioMap.prototype.setAutoCompleteEvent = function(func) {
    this.onAutoCompleteEvent = func;
};

///registered with every single marker that was added to the map via mapObj and this.addPOI()
///
ioMap.prototype.onMarkerClick = function(e, ims) {
	this.editMode = true;
    //store current marker
    ioMap.prototype.currentMarker = e.target;

    //read the id, that was set on 'getShorts
	var he = $.parseHTML(e.target._popup._content);
	var id = $(he).attr('poi_id');

    /* old version
	if(!$.trim($(he).html()).length){
		//no content is loaded in this poi's popup yet
		//get it from the server
		ims.io.listen('getPoi_' + id, function(packet){
			$(he).html(new poiObj(packet).toHtml()); //use the poiObj class to generate the inner html for the marker
			e.target._popup._content = $(he).prop('outerHTML');
			e.target.closePopup();
			e.target.openPopup(); //refresh popup content
		});
		ims.io.send('getPoi', id);
	}
	*/

    //new version, make sure we always show the current version from the server's db
    ims.io.send('getPoi', id);
};

///called by the server after onMarkerClick was triggered!
///
ioMap.prototype.updateMarkerContent = function(poi) {

    if($.isArray(poi)) //if fed straight from socket.io
        poi = poi[0];

    if(!poi || !poi.ID){
        alert("Oups! That shouldn't have happend! Please try to load this marker again!");
        return;
    }

    //change marker-popup content
    var marker = this.getMarkerById(poi.ID);
    var poi = new poiObj(poi); //load poi from server packet
	
	marker.empty(); //clear the marker
	
	if(!this.editNextPoi) {
		marker.html(poi.toHtml()); //fill it up!
	} else {
		this.editNextPoi = false;
		marker.html(poi.toEditHtml()); //fill it up in edit mode! (user added new poi)
	}
};

///changes the view on inside of the popup
///
ioMap.prototype.onMarkerEdit = function(id) {
	console.log(id);
    this.editMode = true;
    var marker = this.getMarkerById(id);
    var poi = new poiObj();
    poi.fromHtml(marker); //read poiObj from jquery dom obj
    marker.empty(); //clear the element
    marker.html(poi.toEditHtml()); //create an html edit view from the poi obj
};

///triggers a delete on the server
///
ioMap.prototype.onMarkerRemove = function(id) {
    //this.getPopupById(id).remove(); //does not delete the marker, only the popup
    this.io.send('removePoi', id);
};

///strict changes and call to the server (to save the poi)
///
ioMap.prototype.onMarkerSave = function(id) {
    var marker = this.getMarkerById(id);
    var poi = new poiObj();
    poi.fromEditHtml(marker); //read from jquery dom edit obj
    marker.empty(); //clear the element
    marker.html(poi.toHtml()); //create an html default view from the poi obj

    //update on the server side, will throw and alert if it didn't work
	console.log(poi);
    this.io.send('changePoi', poi);
    this.editMode = false;
};

///triggers the review call on the server
///
ioMap.prototype.onMarkerReviews = function(id) {
    this.io.send('getReviews', id);
};

///called by the server after onMarkerReviews() triggers the request
///
ioMap.prototype.doMarkerReviews = function(reviews) {
    if(!reviews){
        alert("Oups! Something went wrong, please try to load the reviews again.");
        return;
    }

    if(reviews.length == 0){
        alert("Looks like there are no reviews for this POI yet, why don't add one?");
        return;
    }

    var poi_id = reviews[0].poi_id; //get the poi_id from the first element, we haven't passed it
    var marker = this.getMarkerById(poi_id);
    marker.empty(); //get the marker and clear its inner html

    reviews.reverse(); //show latest reviews first

    var content = "<div id='poi_" + poi_id + "_review_list'><span id='reviews-head'>Reviews:</span><br />";
    //run through all reviews, cast them to a reviewObj and create html elements of them
    for(var i = 0; i < reviews.length; i++)
        content += new reviewObj(reviews[i]).toHtml();

    //append a button to get back to the normal POI view
    content += "<a class='button review-back' onclick='on_review_back_click(" + poi_id + ")'>Back</a>";
    content += "</div>";

    marker.html(content); //change content of the popup
};

///change view in popup to text with add button
///
ioMap.prototype.onMarkerAddReview = function(id) {
    var marker = this.getMarkerById(id);
    marker.empty();
    marker.html(new reviewObj().toEditHtml(id));
};

///called if the visitor clicks the save button on/after onMarkerAddReview()
///
ioMap.prototype.onMarkerSaveReview = function(id) {
    var marker = this.getMarkerById(id);
    var review = new reviewObj();
    review.fromEditHtml(marker); //get the marker back in place

    this.io.send('addReview', review);
    this.onMarkerBack(id); //change popup view
};

///triggered on server after onMarkerSaveReview()
///
ioMap.prototype.doMarkerSaveReview = function(res) {
    if(res){
        alert("Saved your review " + res + " !");
    } else {
        alert("Oups! Couldn't save your review, please try again!");
    }
};

///going back from review-popup to normal-popup content
///
ioMap.prototype.onMarkerBack = function(id) {
    this.io.send('getPoi', id); //just call the getPoi function, the client event will take care of the rest
};

///executed by the server
///
ioMap.prototype.doMarkerRemove = function(res) {
    if(res){
        //this.map.deletePopup(ioMap.prototype.currentMarker);
		 this.map.deleteMarkerById(res);
    } else {
        alert("Oups! Something went wrong, please try to delete the POI again.");
    }
};

///returns the marker, to be more precise it returns the inner-html of the marker's popup that i have added
///
ioMap.prototype.getMarkerById = function(id) {
    return $(".poi_marker[poi_id=" + id + "]");
};

///returns the marker inside of the layer (leaflet_id_reference) used to remove the marker from the map
///
ioMap.prototype.getPopupById = function(id) {
    return $(".poi_marker[poi_id=" + id + "]").closest(".leaflet-popup");
};

///ask server for his default location
///
ioMap.prototype.setToDefaultServerLocation = function(){
	this.io.send('getDefaultLocation');
};

///triggers a call to the server that will return a list of shortended pois
///
ioMap.prototype.getShorts = function(){
	this.io.send('getShorts');
};

///get an poi.ID from the server first
///
ioMap.prototype.registerNewPOI = function(poi) {
    if(poi.ID != 0)
        console.log("you cant set a poi before getting an id from the server! it will be ignored!");
    ioMap.prototype.currentPoi = poi;
    this.io.send('addPoi', poi);
};

///and add the poi to the map afterwards (called from server after registerNewPOI triggers)
///
ioMap.prototype.addPOI = function(res){

    var poi = ioMap.prototype.currentPoi;
    poi.ID = res;

	ie = '<div class="poi_marker" poi_id="' + poi.ID + '"></div>';
	this.map.addSimplePopup(res, [poi.lat, poi.lon], ie, this.onMarkerClick, this, true); //additional true will trigger popup
	this.editNextPoi = true; //will trigger poi update to switch to edit mode for the added poi
	this.io.send('getPoi', res); //this will trigger an update for the poi from the server
};

///is called whenever a popup is closed
///
ioMap.prototype.OnPopupCloseEvent = function(scope, evt) {
	setTimeout(function() {
		console.log("Popup closed!");
		scope.editMode = false;
	}, 850); //wait for a short time so that the first click on the map does not trigger an add poi question
};

///is called whenever a popup is opened
///
ioMap.prototype.OnPopupOpenEvent = function(scope, evt) {
	console.log("Popup opened!");
	scope.editMode = true;
};

///gets autocompletes, based on current applied filter
///
ioMap.prototype.getFilterAC = function(){
    this.io.send('getAutoCompletes', {
        "autoType": this.filterClass,
        "autoValue": this.filterValue
    });
};

///event is set in constructor
///this event is registered with mapObj and will be called everytime a visitor clicks on the map background
///
ioMap.prototype.OnMapClickEvent = function(scope, evt){
	
	if(scope.editMode)
		return;

	//scope is passed from the anon function
	if(confirm("You clicked on the Map, do you want to add a POI here?")){
		var poi = new poiObj();
		poi.lat = evt.latlng.lat;
		poi.lon = evt.latlng.lng;
		scope.registerNewPOI(poi);
	}
};

///event is set in constructor
///when the visitor pans the map (moves around with mousehold)
///
ioMap.prototype.OnMapPanningEvent = function(scope, evt){
    if(!scope.editMode) { //dont disturb if in edit mode
        var c = scope.map.getCenter();
        var z = scope.map.getZoom();
        console.log("zoomed or panned! center changed to: " + c.lat + "," + c.lng + " : " + z);

        var filter = {
            "lat": c.lat,
            "lon": c.lng,
            "zoom": z,
            "class": scope.filterClass,
            "value": scope.filterValue
        };

        scope.io.send("getShorts", filter); //refresh markers on map
    }
};