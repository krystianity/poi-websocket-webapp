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
and object of a poi review.
*/

function reviewObj(packet) {

    if(typeof packet === "undefined") {

        this.id = 0;
        this.poi_id = 0;
        this.review = 'none';

    } else {

        if($.isArray(packet)) //if fed straight from socket.io
            packet = packet[0];

        this.id = packet.id;
        this.poi_id = packet.poi_id;
        this.review = packet.review;
    }
};

reviewObj.prototype.toHtml = function(){

    var container = "<div class='show-review'>";

    container += "<span class='review-id'>" + this.id + "</span>";
    container += "<span class='review-poi_id'>" + this.poi_id + "</span>";
    container += "<span class='review-review'>" + this.review + "</span>";

    //edit and delete could be added to the review list as well
    //container += "<a class='button review-edit' onclick='on_review_edit_click(" + this.id + ")'>Edit</a><br />";
    //container += "<a class='button review-delete' onclick='on_review_delete_click(" + this.id + ")'>Remove</a><br />";

    container += "</div>";
    return container;
};

reviewObj.prototype.fromHtml = function(jquery) {

	if(typeof jquery === "undefined")
		return;

    this.id = jquery.find(".show-review .review-id").html();
    this.poi_id = jquery.find(".show-review .review-poi_id").html();
    this.review = jquery.find(".show-review .review-review").html();
    console.log(this);
};

reviewObj.prototype.toEditHtml = function(poi_id) {
    var container = "<div class='full-review'>";

    container += "<input class='review-id' type='text' value='" + this.id + "'>";
    container += "<input class='review-poi_id' type='text' value='" + poi_id + "'>";
    container += "<textarea class='review-review' rows='3' cols='20'>" + this.review + "</textarea><br />";

    container += "<a class='button poi-save' onclick='on_review_save_click(" + poi_id + ")'>Save</a><br />";
    container += "<a class='button review-back' onclick='on_review_back_click(" + poi_id + ")'>Back</a>";

    container += "</div>";
    return container;
};

reviewObj.prototype.fromEditHtml = function(jquery) {
	
	if(typeof jquery === "undefined")
		return;

    this.id = jquery.find(".full-review .review-id").val();
    this.poi_id = jquery.find(".full-review .review-poi_id").val();
    this.review = jquery.find(".full-review .review-review").val();
    console.log(this);
};