var express = require("express");
var req = require('request');
var async = require('async');
var bodyParser = require('body-parser');
var app = express();
var ejs = require('ejs');
app.set('view engine', 'ejs');

require("dotenv").config();
app.use(express.static(__dirname + '/views'));
app.use('/assets', express.static('static'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json())


var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';
// var baseurl = 'http://local.test:8000/api/v1/projects/';


app.get('/', function (request, response) {
    var opts = {};
    if (request.query.apitoken && request.query.projectid && request.query.synthesisid && request.query.cteamid) {
        // synthesis ID is given
        opts = {
            'apitoken': request.query.apitoken,
            'projectid': request.query.projectid,
            'synthesisid': request.query.synthesisid,
            'cteamid': request.query.cteamid,
        };
        var apikey = request.query.apitoken;
        var cred = "Token " + apikey;
        var projectid = request.query.projectid;
        var cteamid = request.query.cteamid;
        var synthesisid = request.query.synthesisid;
        var synprojectsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/';
        var systemsurl = baseurl + projectid + '/systems/';
        var boundsurl = baseurl + projectid + '/bounds/';
        var URLS = [synprojectsurl, boundsurl, systemsurl];
        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {

            if (err) return response.sendStatus(500);
            var gj = JSON.stringify(results[0]);
            var bounds = results[1];
            var sys = JSON.stringify(results[2]);


            opts['result'] = gj;
            opts['bounds'] = JSON.stringify(bounds['bounds']);
            opts['systems'] = sys;
            opts['basemap_tiles'] = process.env.TILES_URL;
            response.render('index', opts);
        });

    }
    else if (request.query.apitoken && request.query.projectid && request.query.username) {
        // synthesis ID is given
        opts = {
            'apitoken': request.query.apitoken,
            'projectid': request.query.projectid,
            'username' : request.query.username,
            'synthesisid': '0',
            'cteamid':'0'
        };
        var apikey = request.query.apitoken;
        var cred = "Token " + apikey;
        var projectid = request.query.projectid;
        var username = request.query.username;
        
        var synprojectsurl = baseurl + projectid + '/members/' + username + '/diagrams/';
        var systemsurl = baseurl + projectid + '/systems/';
        var boundsurl = baseurl + projectid + '/bounds/';
        var URLS = [synprojectsurl, boundsurl, systemsurl];
        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {

            if (err) return response.sendStatus(500);
            var gj = JSON.stringify(results[0]);
            var bounds = results[1];
            var sys = JSON.stringify(results[2]);

            opts['result'] = gj;
            opts['bounds'] = JSON.stringify(bounds['bounds']);
            opts['systems'] = sys;
            opts['basemap_tiles'] = process.env.TILES_URL;
            response.render('index', opts);
        });

    } 
    else {
        response.status(400).send('Not all parameters supplied.')
    }
});

app.listen(process.env.PORT || 5001);