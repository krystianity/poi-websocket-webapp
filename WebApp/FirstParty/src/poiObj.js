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
this class represents the sql table structure
and object of a point of interest.
*/

///constructor, pass a network poiObj to create from or leave null to setup default values
///
function poiObj(packet) {

    if(typeof packet === "undefined") {

        this.ID = 0;
        this.name = 'none';
        this.type = 'none';
        this.country = 'none';
        this.region = 'none';
        this.lon = 0.0;
        this.lat = 0.0;
        this.description = 'none';

    } else {

        if($.isArray(packet)) //if fed straight from socket.io
            packet = packet[0];

        this.ID = packet.ID;
        this.name = packet.name;
        this.type = packet.type;
        this.country = packet.country;
        this.region = packet.region;
        this.lon = packet.lon;
        this.lat = packet.lat;
        this.description = packet.description;
    }
};

///turns poiObj into an HTML field to show onMarkerClick
///
poiObj.prototype.toHtml = function(){

    var container = "<div class='show-poi'>";

    container += "<span class='poi-name'>" + this.name + "</span><br />";
    container += "Type: <span class='poi-type'>" + this.type + "</span><br />";
    container += "Country: <span class='poi-country'>" + this.country + "</span><br />";
    container += "Region: <span class='poi-region'>" + this.region + "</span><br />";
    container += "<span class='poi-desc'>" + this.description + "</span><br />";
    container += "<span class='poi-lat'>" + this.lat + "</span>";
    container += "<span class='poi-lon'>" + this.lon + "</span>";

    container += "<a class='button poi-edit' onclick='on_poi_edit_click(" + this.ID + ")'>Edit</a><br />";
    container += "<a class='button poi-delete' onclick='on_poi_remove_click(" + this.ID + ")'>Remove</a><br />";
    container += "<a class='button poi-reviews' onclick='on_poi_reviews_click(" + this.ID + ")'>Reviews</a><br />";
    container += "<a class='button poi-reviews' onclick='on_poi_add_review_click(" + this.ID + ")'>Add Review</a>";

    container += "</div>";
    return container;
};

///rebuild a poiObj from a given jquery obj html dom element
///
poiObj.prototype.fromHtml = function(jquery){

	if(typeof jquery === "undefined")
		return;

    //throw new UserException("Not implemented!");
    this.ID = jquery.attr("poi_id");
    this.name = jquery.find(".show-poi .poi-name").html();
    this.type = jquery.find(".show-poi .poi-type").html();
    this.country = jquery.find(".show-poi .poi-country").html();
    this.region = jquery.find(".show-poi .poi-region").html();
    this.description = jquery.find(".show-poi .poi-desc").html();
    this.lat = jquery.find(".show-poi .poi-lat").html();
    this.lon = jquery.find(".show-poi .poi-lon").html();
    console.log(this);
};

///turns poiObj into an HTML field to show onMarkerEditClick
///
poiObj.prototype.toEditHtml = function(){
    var container = "<div class='full-poi'>";

    container += "Name: <input class='poi-name' type='text' value='" + this.name + "'><br />";
    container += "Type: <input class='poi-type' type='text' value='" + this.type + "'><br />";
    container += "Country: <input class='poi-country' type='text' value='" + this.country + "'><br />";
    container += "Region: <input class='poi-region' type='text' value='" + this.region + "'><br />";
    container += "Description: <input class='poi-desc' type='text' value='" + this.description + "'><br />";
    container += "<input class='poi-lat' type='text' value='" + this.lat + "'><br />";
    container += "<input class='poi-lon' type='text' value='" + this.lon + "'><br />";

    container += "<a class='button poi-save' onclick='on_poi_save_click(" + this.ID + ")'>Save</a>";

    container += "</div>";
    return container;
};

///rebuild a poiObj from a given jquery obj html dom element
///
poiObj.prototype.fromEditHtml = function(jquery){

	if(typeof jquery === "undefined")
		return;

    this.ID = jquery.attr("poi_id");
    this.name = jquery.find(".full-poi .poi-name").val();
    this.type = jquery.find(".full-poi .poi-type").val();
    this.country = jquery.find(".full-poi .poi-country").val();
    this.region = jquery.find(".full-poi .poi-region").val();
    this.description = jquery.find(".full-poi .poi-desc").val();
    this.lat = jquery.find(".full-poi .poi-lat").val();
    this.lon = jquery.find(".full-poi .poi-lon").val();
    console.log(this);
};