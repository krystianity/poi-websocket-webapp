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

var fs = require('fs');
var dbFile = 'pois.db';
var dbExists = fs.existsSync(dbFile);
var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database(dbFile);

function POIDealer(callback) {
	var parent = this;
	db.parallelize(function(){

		if(!dbExists)
			parent.createDatabase(callback);
		else
			callback();

	});
	console.log('Points of Interest DBHandler initialized.');
};

POIDealer.prototype.createDatabase = function(callback){

	db.run('CREATE TABLE pointsofinterest (' +
         'ID integer PRIMARY KEY AUTOINCREMENT,' + //sticking to the database, as it was given in the task
         'name varchar(255) DEFAULT NULL,' +
         'type varchar(255) DEFAULT NULL,' +
         'country varchar(255) DEFAULT NULL,' +
         'region varchar(255) DEFAULT NULL,' +
         'lon float DEFAULT NULL,' +
         'lat float DEFAULT NULL,' +
         'description text' +
        ')', function(err, res){

            if(err)
                console.log('failed to create table pointsofinterest.');

            db.run('CREATE TABLE poi_reviews (' +
                 'id integer PRIMARY KEY AUTOINCREMENT,' +
                 'poi_id integer DEFAULT NULL,' +
                 'review text' +
                ')', function(err, res){

                if(err)
                    console.log('failed to create table poi_reviews.');

                db.run('CREATE TABLE poi_users (' +
                     'id integer PRIMARY KEY AUTOINCREMENT,' +
                     'username varchar(255) DEFAULT NULL,' +
                     'password varchar(255) DEFAULT NULL,' +
                     'isadmin tinyint(4) DEFAULT "0"' +
                    ')', function(err, res){

					if(err)
						console.log('failed to create poi_users');

					callback();

				});
		});
	});
};

POIDealer.prototype.addNewPOI = function(poi, callback){
	var stmt = db.prepare('INSERT INTO pointsofinterest(name, type, country, region, lon, lat, description) VALUES(?, ?, ?, ?, ?, ?, ?)');
	stmt.run(poi.name, poi.type, poi.country, poi.region, poi.lon, poi.lat, poi.description, function(){
		stmt.finalize();
		if(this.changes != 1) callback(false);
		else callback(null, this.lastID);
	});
};

POIDealer.prototype.removePOIFromId = function(id, callback){
	var stmt = db.prepare('DELETE FROM pointsofinterest WHERE ID = ?');
	stmt.run(id, function(){
		stmt.finalize();
		callback(this.changes);
	});
};

POIDealer.prototype.getPOIFromId = function(id, callback){
	var stmt = db.prepare('SELECT * FROM pointsofinterest WHERE ID = ?');
	stmt.all(id, function(err, res){
		stmt.finalize();
		if(err) callback(err);
		else callback(null, res);
	});
};

POIDealer.prototype.getPOICount = function(callback){
	var stmt = db.prepare('SELECT COUNT(*) AS poit FROM pointsofinterest');
	stmt.all(function(err, res) {
		stmt.finalize();
		if(err) callback(res);
		else callback(null, res[0].poit);
	});
};

POIDealer.prototype.changePOI = function(poi, callback){
    var stmt = db.prepare('UPDATE pointsofinterest SET name = ?, type = ?, country = ?, region = ?, lon = ?, lat = ?, description = ? WHERE ID = ?');
    stmt.run(poi.name, poi.type, poi.country, poi.region, poi.lon, poi.lat, poi.description, poi.ID, function () {
        stmt.finalize();
        callback(this.changes);
    });
};

POIDealer.prototype.getAllPOIsShort = function(callback){
	db.all('SELECT ID, name, lon, lat FROM pointsofinterest', function(err, res){
		if(err) callback(err);
		else callback(null, res);
	});
};

///turns center latlon into rectangle with the help of a range
///
POIDealer.prototype.latlonToRect = function(latlong, range){

    var south = latlong[0] - range;
    var west = latlong[1] - range;
    var north = latlong[0] + range;
    var east = latlong[1] + range;

    latlong[0] = south;
    latlong[1] = west;
    latlong[2] = north;
    latlong[3] = east;

    return latlong;
};

///RDBMS like escape function, node.js CUBRID
///
POIDealer.prototype.escapeString = function (val) {
    val = val.replace(/[\0\n\r\b\t\\'"\x1a]/g, function (s) {
        switch (s) {
            case "\0":
                return "\\0";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\b":
                return "\\b";
            case "\t":
                return "\\t";
            case "\x1a":
                return "\\Z";
            case "'":
                return "''";
            case '"':
                return '""';
            default:
                return "\\" + s;
        }
    });

    return val;
};

POIDealer.prototype.getFilteredPOIsShort = function(filter, callback) {
    //this.getAllPOIsShort(callback);

    /* acos, cos, sin do not exist in sqlite3..would have to add these functions to
	the c++ source code or change the database structure..
	
    //gather pois from own database
    var sql = "select ID, name, lon, lat,"
        + " ( 6371000 * acos( cos( radians(?) )"
        + " * cos( radians( pointsofinterest.lat ) )"
        + " * cos( radians( pointsofinterest.lon ) - radians(?) )"
        + " + sin( radians(?) )"
        + " * sin( radians( pointsofinterest.lat ) ) ) ) AS db_distance"
        + " from pointsofinterest"
        + " where pointsofinterest.lat between ? and ?"
        + " and pointsofinterest.lon between ? and ?"
        + " having db_distance < ? ORDER BY db_distance";

    var stmt = db.prepare(sql);
    var ll = [filter.lat, filter.lon];
    var rect = this.latlonToRect(ll, filter.zoom);

    stmt.all(ll[0], ll[1], ll[0], rect[0], rect[1], rect[2], rect[3], filter.zoom, function(err, res){
        stmt.finalize();
        if(err) callback(err);
        else callback(null, res);
    });
    */

    //alternative (somple) ranged version
    //since the accurate one that uses distance doesn't work

    var sql = "SELECT ID, name, lon, lat"
        + " FROM pointsofinterest";

        var addsql = " WHERE ";
        if(filter.class && filter.class != null && filter.value != "*" &&
            (filter.class == "type" || filter.class == "region" || filter.class == "country" || filter.class == "name"))
        {
            addsql += filter.class + " LIKE '" + this.escapeString(filter.value) + "%'"
        } else {
            addsql += "1 = 1";
        }

        sql += addsql;
        sql += " AND pointsofinterest.lat BETWEEN ? AND ?"
        + " AND pointsofinterest.lon BETWEEN ? AND ?";

    var stmt = db.prepare(sql);
    var ll = [filter.lat, filter.lon];

    //zoom can be 0 (farest away) -> 18 (closest)
    var distance = (20 - filter.zoom) * 0.005;
    var rect = this.latlonToRect(ll, distance);

    stmt.all(rect[0], rect[2], rect[1], rect[3],  function(err, res){
        stmt.finalize();
        if(err) callback(err);
        else callback(null, res);
    });
};

/* additional */

POIDealer.prototype.getShortPOIsFromType = function(type, callback){
	var stmt = db.prepare('SELECT ID, name, lon, lat FROM pointsofinterest WHERE type = ?');
	stmt.all(type, function(err, res){
		stmt.finalize();
		if(err) callback(err);
		else callback(null, res);
	});
};

POIDealer.prototype.getShortPOIsFromCountry = function(country, callback){
	var stmt = db.prepare('SELECT ID, name, lon, lat FROM pointsofinterest WHERE country = ?');
	stmt.all(country, function(err, res){
		stmt.finalize();
		if(err) callback(err);
		else callback(null, res);
	});
};

POIDealer.prototype.getShortPOIsFromRegion = function(region, callback){
	var stmt = db.prepare('SELECT ID, name, lon, lat FROM pointsofinterest WHERE region = ?');
	stmt.all(region, function(err, res){
		stmt.finalize();
		if(err) callback(err);
		else callback(null, res);
	});
};

POIDealer.prototype.getShortPOIsFromName = function(name, callback){
	var stmt = db.prepare('SELECT ID, name, lon, lat FROM pointsofinterest WHERE name LIKE %?%');
	stmt.all(name, function(err, res){
		stmt.finalize();
		if(err) callback(err);
		else callback(null, res);
	});
};

POIDealer.prototype.getAllPOIsDetailed = function(callback){
	db.all('SELECT * FROM pointsofinterest', function(err, res){
		if(err) callback(err);
		else callback(null, res);
	});
};

/* database handler for poi reviews */

POIDealer.prototype.getReviewsForPoi = function(poi_id, callback){
	var stmt = db.prepare('SELECT * FROM poi_reviews WHERE poi_id = ?');
	stmt.all(poi_id, function(err, res){
		stmt.finalize();
		if(err) callback(err);
		else callback(null, res);
	});
};

POIDealer.prototype.addReview = function(review, callback){
	var stmt = db.prepare('INSERT INTO poi_reviews(poi_id, review) VALUES(?, ?)');
	stmt.run(review.poi_id, review.review, function(){
		stmt.finalize();
		if(this.changes != 1) callback(false);
		else callback(null, this.lastID);
	});
};

POIDealer.prototype.removeReviewOfId = function(id, callback){
	var stmt = db.prepare('DELETE FROM poi_reviews WHERE id = ?');
	stmt.run(id, function(){
		stmt.finalize();
		callback(this.changes);
	});
};

/* database handler for poi_users */

POIDealer.prototype.getUserIdFromCredentials = function(username, password, callback){
	var stmt = db.prepare('SELECT id FROM poi_users WHERE username = ? AND password = ?');
	stmt.all(username, password, function(err, res){
		stmt.finalize();
		if(err) callback(err);
		else callback(null, res);
	});
};

/* misc */

POIDealer.prototype.getAllTypes = function(like, callback){
    var stmt = db.prepare("SELECT DISTINCT type FROM pointsofinterest WHERE type LIKE ? LIMIT 10");
    like = like + "%";
    stmt.all(like, function(err, res){
        stmt.finalize();
        if(err) callback(err);
        else callback(null, res);
    });
};

POIDealer.prototype.getAllRegions = function(like, callback) {
    var stmt = db.prepare("SELECT DISTINCT region FROM pointsofinterest WHERE region LIKE ? LIMIT 10");
    like = like + "%";
    stmt.all(like, function(err, res){
        stmt.finalize();
        if(err) callback(err);
        else callback(null, res);
    });
};

POIDealer.prototype.getAllCountries = function(like, callback) {
    var stmt = db.prepare("SELECT DISTINCT country FROM pointsofinterest WHERE country LIKE ? LIMIT 10");
    like = like + "%";
    stmt.all(like, function(err, res){
        stmt.finalize();
        if(err) callback(err);
        else callback(null, res);
    });
};

POIDealer.prototype.getAllNames = function(like, callback) {
    var stmt = db.prepare("SELECT DISTINCT name FROM pointsofinterest WHERE name LIKE ? LIMIT 10");
    like = like + "%";
    stmt.all(like, function(err, res){
        stmt.finalize();
        if(err) callback(err);
        else callback(null, res);
    });
};

POIDealer.prototype.shutdown = function(callback){
	db.close(callback);
};

exports.POIDealer = POIDealer;