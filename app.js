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


// var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';
var baseurl = 'http://local.test:8000/api/v1/projects/';

app.get('/', function (request, response) {
    const { apitoken, projectid, synthesisid, cteamid, username } = request.query;

    if (!apitoken || !projectid) {
        return response.status(400).send('Not all parameters supplied.');
    }

    const cred = `Token ${apitoken}`;
    const opts = {
        apitoken,
        projectid,
        synthesisid: synthesisid || '0',
        cteamid: cteamid || '0',
        username: username || null
    };

    const URLS = username
        ? [
            `${baseurl}${projectid}/members/${username}/diagrams/`,
            `${baseurl}${projectid}/bounds/`,
            `${baseurl}${projectid}/systems/`
        ]
        : [
            `${baseurl}${projectid}/cteams/${cteamid}/${synthesisid}/`,
            `${baseurl}${projectid}/bounds/`,
            `${baseurl}${projectid}/systems/`
        ];

    async.map(URLS, function (url, done) {
        req({
            url,
            headers: {
                "Authorization": cred,
                "Content-Type": "application/json"
            }
        }, function (err, res, body) {
            if (err || res.statusCode !== 200) {
                return done(err || new Error());
            }
            return done(null, JSON.parse(body));
        });
    }, function (err, results) {
        if (err) return response.sendStatus(500);

        opts.result = JSON.stringify(results[0]);
        opts.bounds = JSON.stringify(results[1]?.bounds || {});
        opts.systems = JSON.stringify(results[2]);
        opts.basemap_tiles = process.env.TILES_URL;
        opts.maptiler_key = process.env.MAPTILER_KEY;

        response.render('index', opts);
    });
});

app.listen(process.env.PORT || 5001);