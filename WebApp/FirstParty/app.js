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

var iox = {}; //global

$(function(){

    //instanciate map with the socket.io and leaflet.js wrapper classes
    iox = new ioMap(
        new mapObj("map", "map_e", true),
        new ioObj('http://ssu.5cf.de:3535'),
        true);

    //set servers default position (if the device localisation fails later)
    iox.setToDefaultServerLocation();

    //and try to adapt to the devices current position
    setTimeout(function() {
        iox.map.getGEO(function (latlon) {
            iox.map.setGEO(latlon, 15);
        });
    }, 1350);
	
	iox.userDiv = "#concount";
	iox.poiDiv = "#poicount";

	$("#map").css("height", ($(window).height() - $(window).height() / 100 * 5));
});

function on_poi_edit_click(poiId){
    console.log("edit event on poi " + poiId);
    iox.onMarkerEdit(poiId);
};

function on_poi_remove_click(poiId){
    if(confirm("Do you really want to delete this POI?")){
        console.log("remove event on poi " + poiId);
        iox.onMarkerRemove(poiId);
    }
};

function on_poi_save_click(poiId){
    console.log("save event on poi " + poiId);
    iox.onMarkerSave(poiId);
};

function on_poi_reviews_click(poiId){
    console.log("loading reviews for poi " + poiId);
    iox.onMarkerReviews(poiId);
};

function on_review_back_click(poiId) {
    console.log("going back to the poi " + poiId);
    iox.onMarkerBack(poiId);
};

function on_poi_add_review_click(poiId){
    console.log("adding review for poi " + poiId);
    iox.onMarkerAddReview(poiId);
};

function on_review_save_click(poiId){
    if(confirm("Do you really want to save this review?")) {
        console.log("saving review for poi " + poiId);
        iox.onMarkerSaveReview(poiId);
    }
};