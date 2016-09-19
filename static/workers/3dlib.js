importScripts('../js/turfjs/turf.min.js');

function genStreetsGrid(pointsWithin, extent) {
    // This module generates streets. given a grid of points. 
    var rows = [];
    var columns = [];
    var buildingPoints = [];
    var roadPoints = [];
    var buildingPointsVert = [];
    var roadPointsVert = [];
    for (var k = 0, ptslen = pointsWithin.features.length; k < ptslen; k++) {
        var curPt = pointsWithin.features[k];
        var curLng = curPt.geometry.coordinates[0];
        var curLat = curPt.geometry.coordinates[1];
        if (rows[curLng]) {} else {
            rows[curLng] = [];
        }
        if (columns[curLat]) {} else {
            columns[curLat] = [];
        }
        rows[curLng].push(curPt);
        columns[curLat].push(curPt);
    }

    var allCols = [];
    var allRows = [];
    for (key in columns) {
        allCols.push({
            'key': key,
            'points': columns[key]
        });
    }
    for (key in rows) {
        allRows.push({
            'key': key,
            'points': rows[key]
        });
    }

    var rCounter = 0;
    var cCounter = 0;
    var sortedCols = allCols.sort(function(a, b) {
        return parseFloat(a.key) - parseFloat(b.key);
    });
    var sortedRows = allRows.sort(function(a, b) {
        return parseFloat(a.key) - parseFloat(b.key);
    });
    for (var x2 = 0, collen = sortedCols.length; x2 < collen; x2++) {
        var feattype = (rCounter % 3 === 0) ? "road" : "building";
        // var pts = sortedCols[x2].points;
        (feattype === 'road') ? roadPoints.push(sortedCols[x2]): buildingPoints.push(sortedCols[x2]);
        rCounter += 1;
    }
    for (var x3 = 0, rowlen = sortedRows.length; x3 < rowlen; x3++) {
        var feattype = (cCounter % 5 === 0) ? "road" : "building";
        // var pts = sortedCols[x2].points;
        (feattype === 'road') ? roadPointsVert.push(sortedRows[x3]): buildingPointsVert.push(sortedRows[x3]);
        cCounter += 1;
    }
    // var allLines = [];
    var streets = [];
    var distance = 0;

    for (var k1 = 0, numRoads = roadPoints.length; k1 < numRoads; k1++) {
        var curRoad = roadPoints[k1];
        var tmpPts = [];
        for (var p1 = 0, ptsLen = curRoad.points.length; p1 < ptsLen; p1++) {
            tmpPts.push(curRoad.points[p1].geometry.coordinates);
        }
        if (tmpPts.length > 1) {
            var linestring = turf.lineString(tmpPts);
            // allLines.push(linestring);
            var d = turf.lineDistance(linestring, 'kilometers');
            distance = (distance > Math.round(d)) ? distance : Math.round(d);
            var street = turf.buffer(linestring, 0.0075, 'kilometers');
            if (street['type'] === "Feature") {
                street = { "type": "FeatureCollection", "features": [street] }
            }

            street.features[0].properties = {
                "color": "#202020",
                "roofColor": "#202020",
                "height": 0.1
            };
            streets.push.apply(streets, street.features);
        }
    }
    if (distance >= 0.7) { // there is a road that is greater than 1KM, so we need vertical streets.

        for (var k2 = 0, numRoads = roadPointsVert.length; k2 < numRoads; k2++) {
            var curRoad = roadPointsVert[k2];
            var tmpPts = [];
            for (var p2 = 0, ptsLen = curRoad.points.length; p2 < ptsLen; p2++) {
                tmpPts.push(curRoad.points[p2].geometry.coordinates);
            }

            if (tmpPts.length > 1) { // valid line
                var linestring = turf.lineString(tmpPts);
                var street = turf.buffer(linestring, 0.0075, 'kilometers');
                if (street['type'] === "Feature") {
                    street = { "type": "FeatureCollection", "features": [street] }
                }
                street.features[0].properties = {
                    "color": "#202020",
                    "roofColor": "#202020",
                    "height": 0.1
                };
                streets.push.apply(streets, street.features);
            }
        }
    }
    var s = {
        "type": "FeatureCollection",
        "features": streets
    };
    return s;
}

function genStreetsHeatMapped(pointsWithin, extent) {
    function generateLineFeatures(curTriangleFeat) {
        var coords = curTriangleFeat.geometry.coordinates[0];

        // console.log(JSON.stringify(coords));
        // console.log(JSON.stringify(coords[0]));
        var l1 = turf.lineString([coords[0], coords[1]]);
        var l2 = turf.lineString([coords[0], coords[2]]);
        var l3 = turf.lineString([coords[1], coords[2]]);
        return [l1, l2, l3];
    }

    function keyFor(item) {
        return item.geometry.coordinates[0] + ':' + item.geometry.coordinates[1];
    }
    // var area = Math.round(turf.area(pointsWithin));
    // var points = {0: 360.0,1: 180.0,2: 90.0,3: 45.0,4: 22.5,5: 11.25,6: 5.625,7: 2.813,8: 1.406,9: 0.703,10: 0.352,11: 0.176,12: 0.088,13: 0.044,14: 0.022,15: 0.011,16: 0.005,17: 0.003,18: 0.001,19: 0.0005};
    var heatmap = turf.random('points', 5, {
        bbox: extent
    });
    // console.log(JSON.stringify(extent));
    var startPoint = turf.point([extent[0], extent[1]]);
    // assign a random z property.
    for (var i = 0; i < heatmap.features.length; i++) {
        heatmap.features[i].properties.z = (Math.random() * 9);
    }
    var tin = turf.tin(heatmap, 'z');
    for (var i = 0; i < tin.features.length; i++) {
        var properties = tin.features[i].properties;
        properties.fill = '#' + properties.a +
            properties.b + properties.c;
    }
    var tinPtsFC = {
        "type": "FeatureCollection",
        "features": []
    };
    for (var k = 0; k < tin.features.length; k++) {
        var prop = tin.features[k].properties;
        var tincoords = tin.features[k].geometry.coordinates[0];
        for (var m = 0; m < tincoords.length; m++) {
            var tco = tincoords[m];
            var ptFeat = {
                "type": "Feature",
                "properties": prop,
                "geometry": {
                    "type": "Point",
                    "coordinates": tco
                }
            };
            tinPtsFC.features.push(ptFeat);
        }
    }
    var roadStart = turf.nearest(startPoint, tinPtsFC);
    var ptindexed = {};
    var ptcounts = {};
    tinPtsFC.features.forEach(function(item) {
        var key = keyFor(item);
        item.properties.key = key;
        var exists = ptindexed[key];
        ptcounts[keyFor(item)] = (exists) ? ptcounts[keyFor(item)] + 1 : 0;
        ptindexed[key] = item;
    });
    var result = Object.keys(ptindexed).map(function(k) {
        return ptindexed[k];
    });
    tinPtsFC.features = result;
    // console.log(JSON.stringify(tinPtsFC));
    var arr = Object.keys(ptcounts).map(function(key) {
        return ptcounts[key];
    });
    var minfreq = Math.min.apply(null, arr);
    var maxfreq = Math.max.apply(null, arr);
    var diff = maxfreq - minfreq;
    var threshold = Math.round((diff * 90) / 100);
    var ptsofInt = [];
    var ct = 0;
    for (key in ptcounts) {
        ct = ct + 1;
        var value = ptcounts[key];
        if (value >= threshold) {
            ptsofInt.push(key);
        }
    }
    // extract all points from tin
    var tinLinesFC = {
        "type": "FeatureCollection",
        "features": []
    };
    var fc = [];
    for (var k = 0; k < tin.features.length; k++) {
        var curTriangle = tin.features[k];
        var lineFeatures = generateLineFeatures(curTriangle);
        tinLinesFC.features.push.apply(tinLinesFC.features, lineFeatures);
    }

    // All the line segements from the tin are extracted.
    // check count
    function isInArray(value, array) {
        return array.indexOf(value) > -1;
    }

    var indexed = [];
    var filteredFeats = [];
    tinLinesFC.features.forEach(function(item) {
        // a duplicate key will replace the existing entry
        var key = item.properties.id;
        if (isInArray(key, indexed)) {

        } else {
            indexed.push(key);
            filteredFeats.push(item);
        }
    });
    var mainPts = [];
    for (var p = 0; p < ptsofInt.length; p++) {
        var ptKey = ptsofInt[p];
        for (var o = 0; o < tinPtsFC.features.length; o++) {
            var curF = tinPtsFC.features[o];
            if (curF.properties.key === ptKey) {
                mainPts.push(curF);
            }
        }
    }
    var filteredLineFC = {
        "type": "FeatureCollection",
        "features": filteredFeats
    };
    var street = turf.buffer(filteredLineFC, 0.0075, 'kilometers');
    if (street['type'] === "Feature") {
        street = { "type": "FeatureCollection", "features": [street] }
    }
    street.features[0].properties = {
        "color": "#202020",
        "roofColor": "#202020",
        "height": 0.1
    };
    // streets.push.apply(streets, street.features);
    // console.log(JSON.stringify(filteredLineFC));
    // console.log(JSON.stringify(mainPts));
    // var curved = turf.bezier(filteredLineFC.features[0]);
    // var streets = turf.buffer(curved, 0.010, 'kilometers');
    return street;

}

function getGridCellWidth(featProps) {
    // get the reqtag and req name 

    var reqname = featProps.sysname;
    var reqtype = featProps.systag;
    var checkSys = ['HDH', 'LDH'];

    if (checkSys.indexOf(reqname) >= 0) {
        return reqname === 'HDH' ? 0.03 :
            reqname === 'LDH' ? 0.04 :
            0.04;
    } else {
        var taglist = ['Roads, transport', 'A law or regulation', 'Agriculture, Forestry', 'Small buildings, low density housing', 'Large buildings, Industry, commerce'];
        if (taglist.indexOf(reqtype) >= 0) {
            return reqtype === 'Large buildings, Industry, commerce' ? 0.03 :
                reqname === 'Small buildings, low density housing' ? 0.04 :
                0.04
        } else {
            // not in HDH or LDH or correct systype
            return 0.04;
        }
    }

}

function getRandomHeight(reqtype, reqname) {
    var taglist = ['Roads, transport', 'A law or regulation', 'Agriculture, Forestry', 'Small buildings, low density housing', 'Large buildings, Industry, commerce'];
    var checkSys = ['HDH', 'LDH', 'COM'];
    var hdhHeights = [24, 35, 40, 32, 45];
    var comHeights = [14, 25, 30, 22, 28];
    var indHeights = [5, 10, 12, 7];
    var ldhHeights = [1, 2, 3];
    var smbHeights = [2, 3, 5, 6, 7, 10];
    var labHeights = [15, 20, 25, 22, 12];
    var restHeights = [0, 2, 5];
    // console.log(reqname);
    if (checkSys.indexOf(reqname) >= 0) {
        return reqname === 'HDH' ? hdhHeights[Math.floor(Math.random() * hdhHeights.length)] :
            reqname === 'LDH' ? ldhHeights[Math.floor(Math.random() * ldhHeights.length)] :
            reqname === 'COM' ? comHeights[Math.floor(Math.random() * comHeights.length)] :
            reqname === 'IND' ? indHeights[Math.floor(Math.random() * indHeights.length)] :
            restHeights[Math.floor(Math.random() * restHeights.length)];
    } else {
        return reqtype === 'Small buildings, low density housing' ? smbHeights[Math.floor(Math.random() * smbHeights.length)] :
            reqtype === 'Large buildings, Industry, commerce' ? labHeights[Math.floor(Math.random() * labHeights.length)] :
            restHeights[Math.floor(Math.random() * restHeights.length)];
    }
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function generateBuildingFootprints(ptsWithin, featProps, cellWidth, unit) {
    var allGeneratedFeats = [];
    var color = featProps.color;
    var roofColor = color;
    var systag = featProps.systag;
    var sysname = featProps.sysname;

    var bufferWidth = cellWidth - 0.01; //30 meter buffer

    var alreadyAdded = { "type": "FeatureCollection", "features": [] };
    // if it is HDH type feature
    if (systag === 'Large buildings, Industry, commerce') {
        var nearestSearch;
        if (sysname === 'HDH') {
            nearestSearch = [0, 1];
        } else {
            nearestSearch = [0, 1, 2];
        }
        // create a unique ID for each feature.
        var availablePts = {};
        var ptslen = ptsWithin.features.length;
        for (var k = 0; k < ptslen; k++) {
            var id = makeid();
            ptsWithin.features[k].properties.id = id;
            availablePts[id] = ptsWithin.features[k];
        }
        // every point is avaiaable 
        for (var k1 = 0; k1 < ptslen; k1++) {
            var ifeat;
            var curalreadyadded;
            var alreadyaddedlen;
            // how many nearest to find? 
            var nearest = nearestSearch[Math.floor(Math.random() * nearestSearch.length)];
            // initialize all poitns
            var allPts = [];
            // get current POint. 
            var curPt = ptsWithin.features[k1];
            delete availablePts[curPt.properties.id];
            allPts.push(curPt.geometry.coordinates);
            if (nearest) {
                for (var k6 = 0; k6 < nearest; k6++) {
                    // already added
                    var availPts = { "type": "FeatureCollection", "features": [] };
                    for (key in availablePts) {
                        var cpt = availablePts[key];
                        availPts.features.push(cpt);
                    }
                    var nearestpt = turf.nearest(curPt, availPts);
                    if (nearestpt) {
                        delete availablePts[nearestpt.properties.id];
                        allPts.push(nearestpt.geometry.coordinates);
                    }
                }
                if (allPts.length > 1) {
                    var ls = turf.lineString(allPts);
                    var buf = turf.buffer(ls, 0.0075, 'kilometers');
                    // console.log(JSON.stringify(bldg));
                    var bb = turf.bbox(buf);
                    var bldg = turf.bboxPolygon(bb);
                    var area = turf.area(bldg);
                    var hasIntersect = false;
                    var alreadyaddedlen = alreadyAdded.features.length;
                    for (var x1 = 0; x1 < alreadyaddedlen; x1++) {
                        curalreadyadded = alreadyAdded.features[x1];
                        ifeat = turf.intersect(curalreadyadded, bldg);
                        if (ifeat) {
                            hasIntersect = true;
                            break;
                        }
                    }
                    if (hasIntersect === false) {

                        var height = getRandomHeight(systag, sysname);

                        var p = {
                            'height': height,
                            'color': "#d0d0d0",
                            'roofColor': color
                        };
                        bldg.properties = p;
                        alreadyAdded.features.push(bldg);
                        allGeneratedFeats.push(bldg);
                    }
                }
                // put the list in the seen one 
                // build a bbounds polygon
            } else {
                var buffered = turf.buffer(curPt, bufferWidth, unit); // buffer 48 meters
                var bds = turf.bbox(buffered); // get the extent of the buffered features
                var bfrdextPlgn = turf.bboxPolygon(bds);
                var bldgfootprint = 0.015;
                var centrepoint = turf.centroid(bfrdextPlgn);
                var bldg = turf.buffer(centrepoint, bldgfootprint, unit);
                var bdgply = turf.bbox(bldg); // get the extent of the buffered features
                var bpoly = turf.bboxPolygon(bdgply);
                alreadyaddedlen = alreadyAdded.features.length;
                var hasIntersect = false;

                for (var x2 = 0; x2 < alreadyaddedlen; x2++) {
                    curalreadyadded = alreadyAdded.features[x2];
                    ifeat = turf.intersect(curalreadyadded, bldg);
                    if (ifeat) {
                        hasIntersect = true;
                        break;
                    }
                }
                if (hasIntersect === false) {
                    var height = getRandomHeight(systag);
                    var chosenValue = Math.random() < 0.5 ? true : false;
                    var chosenValue = true;
                    if (chosenValue) {
                        var p = {
                            'height': height,
                            'color': "#d0d0d0",
                            'roofColor': color
                        };
                        bpoly.properties = p;
                        alreadyAdded.features.push(bpoly);
                        allGeneratedFeats.push(bpoly);

                    }
                }
            }


        }

    } else { // build LDH type feature
        for (var k = 0, ptslen = ptsWithin.features.length; k < ptslen; k++) {
            var curPt = ptsWithin.features[k];
            var buffered = turf.buffer(curPt, bufferWidth, unit); // buffer 48 meters
            var bds = turf.bbox(buffered); // get the extent of the buffered features
            var bfrdextPlgn = turf.bboxPolygon(bds);
            var bldgfootprint = 0.015;
            var centrepoint = turf.centroid(bfrdextPlgn);
            var bldg = turf.buffer(centrepoint, bldgfootprint, unit);
            var bdgply = turf.bbox(bldg); // get the extent of the buffered features
            var bpoly = turf.bboxPolygon(bdgply);
            var height = getRandomHeight(systag);
            var chosenValue = Math.random() < 0.5 ? true : false;
            var chosenValue = true;
            if (chosenValue) {
                var p = {
                    'height': height,
                    'color': "#d0d0d0",
                    'roofColor': color
                };
                bpoly.properties = p;
                allGeneratedFeats.push(bpoly);

            }
        }

    }
    return allGeneratedFeats;
}

function filterStreets(streetgrid, inputFeats) {
    var filteredFeatures = [];
    for (var l = 0; l < inputFeats.length; l++) {
        var curF1 = inputFeats[l];
        var intersects = false;
        for (var p = 0, stLen = streetgrid.features.length; p < stLen; p++) {
            var curStF = streetgrid.features[p];
            var intersect = turf.intersect(curF1, curStF);
            // chop road

            if (intersect) {
                intersects = true;
            }
        }
        if (intersects) {} else {

            filteredFeatures.push(curF1);
        }
    }
    return filteredFeatures;
}

function bufferExistingRoads(inputroads) {
    var streets = [];
    for (var x = 0; x < inputroads.features.length; x++) {
        var linestring = inputroads.features[x];
        var street = turf.buffer(linestring, 0.0075, 'kilometers');
        if (street['type'] === "Feature") {
            streets.push(street);
        }
    }
    return { "type": "FeatureCollection", "features": streets }


}

function generateFinal3DGeoms(constraintedModelDesigns, genstreets, existingroads) {
    var genstreets = (genstreets === 'false') ? false : true;
    var whiteListedSysName = ['HDH', 'LDH', 'IND', 'COM', 'COMIND', 'HSG'];
    var finalGJFeats = [];
    var plFeats = [];
    // get the center of the design so that the map once returned can be recentered.
    var centerPt = turf.center(constraintedModelDesigns);
    var lat = centerPt.geometry.coordinates[1];
    var lng = centerPt.geometry.coordinates[0];
    // iterate over the features.
    var curFeats = constraintedModelDesigns.features;

    var flen = curFeats.length;
    for (var h = 0; h < flen; h++) {
        // for every feature , create a point grid.
        var curFeat = curFeats[h];
        var curFeatSys = curFeat.properties.sysname;
        // if it is a line then simply buffer it and paint it black with a small height
        if (curFeat.geometry.type === "LineString") {
            f = turf.buffer(curFeat, 0.005, 'kilometers');
            if (f['type'] === "Feature") {
                f = { "type": "FeatureCollection", "features": [f] }
            }
            var linefeats = f.features;
            var linefeatlen = linefeats.length;
            for (var x1 = 0; x1 < linefeatlen; x1++) {
                curlineFeat = linefeats[x1];
                curlineFeat.properties = {
                    "color": curFeat.properties.color,
                    "roofColor": curFeat.properties.color,
                    "height": 2
                };

                finalGJFeats.push.apply(finalGJFeats, [curlineFeat]);
            }


        }
        if (whiteListedSysName.indexOf(curFeatSys) >= 0) {
            if (curFeat.properties.areatype === 'project') {
                var featProps = curFeat.properties;
                var featExtent = turf.bbox(curFeat);
                //100 meter cell width
                var cellWidth = getGridCellWidth(featProps);
                var unit = 'kilometers';
                var diagJSON = {
                    "type": "FeatureCollection",
                    "features": [curFeat]
                };
                // make the grid of 50 meter points
                var grid = turf.pointGrid(featExtent, cellWidth, unit);
                var ptsWithin = turf.within(grid, diagJSON);
                var footprint = generateBuildingFootprints(ptsWithin, featProps, cellWidth, unit);
                finalGJFeats.push.apply(finalGJFeats, footprint);

                var finalFeatures = [];
                var streetFeatureCollection;
                // filter streets

                streetFeatureCollection = genStreetsGrid(ptsWithin, featExtent);
                finalFeatures = filterStreets(streetFeatureCollection, finalGJFeats);
                if (existingroads) {

                    finalFeatures = filterStreets(existingroads, finalFeatures);
                }

                if (genstreets) {
                    finalFeatures.push.apply(finalFeatures, streetFeatureCollection.features);
                }
                finalGJFeats = finalFeatures;

            }

        } else { // for non white listed systems

            if (curFeat.properties.areatype === 'project') {
                var prop = {
                    // 'color': curFeat.properties.color,
                    'roofColor': curFeat.properties.color,
                    'height': 0.01
                }
                curFeat.properties = prop;
                finalGJFeats.push.apply(finalGJFeats, [curFeat]);
            } else if (curFeat.properties.areatype === 'policy') {
                var fe = turf.bbox(curFeat);
                var cw = 0.05;
                var unit = 'kilometers';
                var dJSON = {
                    "type": "FeatureCollection",
                    "features": [curFeat]
                };
                // make the grid of 50 meter points
                var grd = turf.pointGrid(fe, cw, unit);
                var pW = turf.within(grd, dJSON);
                var pwLen = pW.features.length;

                var prop = {
                    // 'color': curFeat.properties.color,
                    'roofColor': curFeat.properties.color,
                    'height': 0.01
                }
                for (var l1 = 0; l1 < pwLen; l1++) {
                    var curptwithin = pW.features[l1];
                    var bufFeat = turf.buffer(curptwithin, 0.0075, 'kilometers');
                    bufFeat.properties = prop;

                    finalGJFeats.push.apply(finalGJFeats, [bufFeat]);
                }
            }
        }
    }
    var fpolygons = {
        "type": "FeatureCollection",
        "features": finalGJFeats
    };
    // console.log(JSON.stringify(fpolygons));
    self.postMessage({
        'polygons': JSON.stringify(fpolygons),
        'center': JSON.stringify([lat, lng])
    });
}


function generate3DGeoms(allFeaturesList, genstreets, existingroads) {;
    var allFeaturesList = JSON.parse(allFeaturesList);
    var existingroads = JSON.parse(existingroads);
    // console.log(JSON.stringify(existingroads));
    if (existingroads) {
        existingroads = bufferExistingRoads(existingroads);

    }
    var threeDOutput = generateFinal3DGeoms(allFeaturesList, genstreets, existingroads);

}

self.onmessage = function(e) {
    generate3DGeoms(e.data.allFeaturesList, e.data.genstreets, e.data.existingroads);
}