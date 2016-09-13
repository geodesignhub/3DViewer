var express = require("express");
var req = require('request');
var async = require('async');
var bodyParser = require('body-parser');
var app = express();

var ejs = require('ejs');
app.set('view engine', 'ejs');


app.use(express.static(__dirname + '/views'));
app.use('/assets', express.static('static'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json())

app.get('/', function(request, response) {
    var opts = {};
    console.log(request.query)
    if (request.query.apitoken && request.query.projectid && request.query.diagramid) {
        opts = { 'apitoken': request.query.apitoken, 'projectid': request.query.projectid, 'diagramid': request.query.diagramid, 'cteamid': '0', 'synthesisid': '0' };

        var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';
        // var baseurl = 'http://local.dev:8000/api/v1/projects/';
        var apikey = request.query.apitoken;
        var cred = "Token " + apikey;
        var projectid = request.query.projectid;
        var diagramid = request.query.diagramid;
        var diagramdetailurl = baseurl + projectid + '/diagrams/' + diagramid + '/';
        var boundsurl = baseurl + projectid + '/bounds/';

        var URLS = [diagramdetailurl, boundsurl];

        async.map(URLS, function(url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function(err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function(err, results) {
            if (err) return response.sendStatus(500);
            var gj = JSON.stringify(results[0]['geojson']);
            var bounds = results[1];

            var roadsURL = "https://geodzn.com/api/v1/sql/gdhsupport?q=SELECT ST_AsGeoJSON(threedviewer.roadsall.the_geom) FROM threedviewer.roadsall WHERE threedviewer.roadsall.the_geom @ ST_MakeEnvelope(" + bounds['bounds'] + ")&key=54ed6c30bec7a53df8202d6057806a03"

            var rURls = [roadsURL];

            async.map(rURls, function(url, done) {
                req({
                    url: url,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }, function(err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return done(err || new Error());
                    }
                    return done(null, JSON.parse(body));
                });
            }, function(err, roads) {
                if (err) return response.sendStatus(500);
                opts['result'] = gj;
                var rfc1 = { "type": "FeatureCollection", "features": [] };

                var rlen1 = roads[0].features.length;
                for (var x7 = 0; x7 < rlen1; x7++) {
                    var curroad = roads[0].features[x7];
                    var roadgj = JSON.parse(curroad.properties.st_asgeojson);
                    var f8 = { "type": "Feature", "properties": {}, "geometry": roadgj };
                    rfc1.features.push(f8);
                }
                opts['roads'] = JSON.stringify(rfc1);

                response.render('index', opts);
            });

        });

    } else if (request.query.apitoken && request.query.projectid && request.query.synthesisid && request.query.cteamid) {
        opts = { 'apitoken': request.query.apitoken, 'projectid': request.query.projectid, 'synthesisid': request.query.synthesisid, 'cteamid': request.query.cteamid, 'diagramid': '0' };

        var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';
        // var baseurl = 'http://local.dev:8000/api/v1/projects/';

        var apikey = request.query.apitoken;
        var cred = "Token " + apikey;
        var projectid = request.query.projectid;
        var cteamid = request.query.cteamid;
        var synthesisid = request.query.synthesisid;
        var synprojectsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/projects/';
        var boundsurl = baseurl + projectid + '/bounds/';
        var URLS = [synprojectsurl, boundsurl];

        async.map(URLS, function(url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function(err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function(err, results) {

            if (err) return response.sendStatus(500);
            var gj = JSON.stringify(results[0]);
            var bounds = results[1];

            var roadsURL = "https://geodzn.com/api/v1/sql/gdhsupport?q=SELECT ST_AsGeoJSON(threedviewer.roadsall.the_geom) FROM threedviewer.roadsall WHERE threedviewer.roadsall.the_geom @ ST_MakeEnvelope(" + bounds['bounds'] + ")&key=54ed6c30bec7a53df8202d6057806a03"

            var rURls = [roadsURL];
            // console.log(roadsURL);
            async.map(rURls, function(url, done) {
                req({
                    url: url,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }, function(err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return done(err || new Error());
                    }
                    return done(null, JSON.parse(body));
                });
            }, function(err, roads) {

                if (err) return response.sendStatus(500);
                opts['result'] = gj;
                var rfc = { "type": "FeatureCollection", "features": [] };
                var rlen = roads[0].features.length;
                for (var x5 = 0; x5 < rlen; x5++) {
                    var curroad = roads[0].features[x5];
                    var roadgj = JSON.parse(curroad.properties.st_asgeojson);
                    var f = { "type": "Feature", "properties": {}, "geometry": roadgj };
                    rfc.features.push(f);
                }
                opts['roads'] = JSON.stringify(rfc);
                response.render('index', opts);

            });

        });

    } else {
        opts = { 'apitoken': '0', 'projectid': '0', 'diagramid': '0', 'result': '0', 'cteamid': '0', 'synthesisid': '0', 'roads': '0' };
        response.render('index', opts);
    }

});




app.listen(process.env.PORT || 5001);