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
    if (request.query.apitoken && request.query.projectid && request.query.diagramid) {
        opts = { 'apitoken': request.query.apitoken, 'projectid': request.query.projectid, 'diagramid': request.query.diagramid };

        var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';
        // var baseurl = 'http://local.dev:8000/api/v1/projects/';
        var apikey = request.query.apitoken;
        var cred = "Token " + apikey;
        var projectid = request.query.projectid;
        var diagramid = request.query.diagramid;
        var diagramdetailurl = baseurl + projectid + '/diagrams/' + diagramid + '/';

        var URLS = [diagramdetailurl];

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
            var gj = JSON.stringify(results[0]['geojson']);
            // console.log(gj);

            if (err) return response.sendStatus(500);
            // response.contentType('application/json');
            // response.send({
            // "status": 1,
            // "results": results
            // });
            opts['result'] = gj;
            response.render('index', opts);
        });

    }
    if (request.query.apitoken && request.query.projectid && request.query.synthesisid && request.query.cteamid) {
        opts = { 'apitoken': request.query.apitoken, 'projectid': request.query.projectid, 'synthesisid': request.query.synthesisid, 'cteamid': request.query.cteamid };

        var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';
        // var baseurl = 'http://local.dev:8000/api/v1/projects/';
        var apikey = request.query.apitoken;
        var cred = "Token " + apikey;
        var projectid = request.query.projectid;
        var diagramid = request.query.diagramid;
        var synprojectsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/projects/';

        var URLS = [synprojectsurl];

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
            var gj = JSON.stringify(results[0]['geojson']);

            if (err) return response.sendStatus(500);

            opts['result'] = gj;
            response.render('index', opts);
        });

    } else {
        opts = { 'apitoken': '0', 'projectid': '0', 'diagramid': '0', 'result': '0' };
        response.render('index', opts);
    }

});




app.listen(process.env.PORT || 5001);