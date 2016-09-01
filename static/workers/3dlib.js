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
        var linestring = turf.linestring(tmpPts);
        // allLines.push(linestring);
        var d = turf.lineDistance(linestring, 'kilometers');
        distance = (distance > Math.round(d)) ? distance : Math.round(d);
        var street = turf.buffer(linestring, 0.0075, 'kilometers');
        street.features[0].properties = {
            "color": "#202020",
            "roofColor": "#202020",
            "height": 2
        };
        streets.push.apply(streets, street.features);
    }
    if (distance >= 0.7) { // there is a road that is greater than 1KM, so we need vertical streets.
        for (var k2 = 0, numRoads = roadPointsVert.length; k2 < numRoads; k2++) {
            var curRoad = roadPointsVert[k2];
            var tmpPts = [];
            for (var p2 = 0, ptsLen = curRoad.points.length; p2 < ptsLen; p2++) {
                tmpPts.push(curRoad.points[p2].geometry.coordinates);
            }
            var linestring = turf.linestring(tmpPts);
            var street = turf.buffer(linestring, 0.0075, 'kilometers');
            street.features[0].properties = {
                "color": "#202020",
                "roofColor": "#202020",
                "height": 2
            };
            streets.push.apply(streets, street.features);
        }
    }
    var s = {
        "type": "FeatureCollection",
        "features": streets
    };
    return s;
}

function genStreetsHeatMapped(pointsWithin, extent) {
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
        heatmap.features[i].properties.z = ~~(Math.random() * 9);
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

    // console.log(JSON.stringify(filteredLineFC));
    // console.log(JSON.stringify(mainPts));
    // var curved = turf.bezier(filteredLineFC.features[0]);
    // var streets = turf.buffer(curved, 0.010, 'kilometers');
    return filteredLineFC;

}

function getRandomHeight(reqtype) {
    var smbHeights = [2, 3, 5, 6, 7, 10];
    var labHeights = [0, 5, 7, 10, 12, 15];
    var restHeights = [0, 2, 5];

    return reqtype === 'SMB' ? smbHeights[Math.floor(Math.random() * smbHeights.length)] :
        reqtype === 'LAB' ? labHeights[Math.floor(Math.random() * labHeights.length)] :
        reqtype === 'POR' ? restHeights[Math.floor(Math.random() * restHeights.length)] :
        reqtype > 'POL' ? 0 :
        reqtype > 'PAV' ? 0 :
        0;
}

function generateFinal3DGeoms(constraintedModelDesigns, genstreets) {
    var genstreets = (genstreets === 'false') ? false : true;
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
        // if it is a line then simply buffer it and paint it black with a small height
        if (curFeat.geometry.type === "LineString") {
            f = turf.buffer(curFeat, 0.005, 'kilometers');
            var linefeats = f.features;
            var linefeatlen = linefeats.length;
            for (var x1 = 0; x1 < linefeatlen; x1++) {
                curlineFeat = linefeats[x1];
                curlineFeat.properties = {
                    "color": "#202020",
                    "roofColor": "#202020",
                    "height": 2
                };

                finalGJFeats.push.apply(finalGJFeats, [curlineFeat]);
            }

        } else if (curFeat.properties.areatype === 'project') {

            var featProps = curFeat.properties;
            var color = featProps.color;
            var roofColor = color;
            var reqTag = featProps.reqtag;
            // featProps.roofShape = 'pyramid';
            // featProps.roofMaterial = 'roof_tiles';
            // featProps.roofHeight = 10;
            // get the extent of the feature
            var featExtent = turf.extent(curFeat);
            //100 meter cell width
            var cellWidth = 0.05; // 100 meter
            var unit = 'kilometers';
            // make this feature a feature collection since point grid only takes in a feature collection
            var diagJSON = {
                "type": "FeatureCollection",
                "features": [curFeat]
            };
            // make the grid of 50 meter points
            var grid = turf.pointGrid(featExtent, cellWidth, unit);
            // filter the grid so that only points within the feature are left.
            var ptsWithin = turf.within(grid, diagJSON);
            // 15 meter subtract
            var bufferWidth = cellWidth - 0.005; //40 meter buffer
            for (var k = 0, ptslen = ptsWithin.features.length; k < ptslen; k++) {
                var curPt = ptsWithin.features[k];
                var buffered = turf.buffer(curPt, bufferWidth, unit); // buffer 48 meters
                var indWidth = bufferWidth - 0.01; // subtract 35 meter = 15 meters
                var bds = turf.extent(buffered); // get the extent of the buffered features
                var subGrid = turf.pointGrid(bds, indWidth, unit); // generate a grid within 34 meters
                for (var h1 = 0, glen = subGrid.features.length; h1 < glen; h1++) {
                    var smallWidth = indWidth - 0.025; //(15-10 = 5 meters width
                    var curSubGrid = subGrid.features[h1];
                    var bfrd = turf.buffer(curSubGrid, smallWidth, unit); // 9 m buffer
                    var bfrdext = turf.extent(bfrd);
                    var bfrdextPlgn = turf.bboxPolygon(bfrdext); // generate the polygons
                    var heightlist = [5, 7, 10, 12, 15];
                    var height = heightlist[Math.floor(Math.random() * heightlist.length)];
                    // console.log(JSON.stringify(featProps));
                    var chosenValue = Math.random() < 0.5 ? true : false;
                    if (chosenValue) {
                        var p = {
                            'height': height,
                            'color': color,
                            'roofColor': color
                        };
                        bfrdextPlgn.properties = p;
                        finalGJFeats.push.apply(finalGJFeats, [bfrdextPlgn]);
                    }
                }
            }
            if (genstreets) {
                var finalFeatures = [];
                var streetFeatureCollection = genStreetsGrid(ptsWithin, featExtent);
                // console.log(JSON.stringify(streetFeatureCollection));
                for (var l = 0; l < finalGJFeats.length; l++) {
                    var curF1 = finalGJFeats[l];
                    var intersects = false;
                    for (var p = 0, stLen = streetFeatureCollection.features.length; p < stLen; p++) {
                        var curStF = streetFeatureCollection.features[p];
                        var intersect = turf.intersect(curF1, curStF);
                        // chop road
                        // var intersect2 = turf.intersect(curFeat, curStF);
                        if (intersect) {
                            intersects = true;
                        }
                    }
                    if (intersects) {} else {
                        // console.log(curF1.properties.height);
                        finalFeatures.push(curF1);
                    }
                }

                finalFeatures.push.apply(finalFeatures, streetFeatureCollection.features);
                finalGJFeats = finalFeatures;
            }

        }
        // else {
        //     var prop = {
        //         'color': curFeat.properties.color,
        //         'roofColor': curFeat.properties.color,
        //         'areatype': curFeat.properties.areatype,
        //         'height': 2
        //     }
        //     curFeat.properties = prop;
        //     finalGJFeats.push.apply(finalGJFeats, [curFeat]);
        // }
    }

    var fpolygons = {
        "type": "FeatureCollection",
        "features": finalGJFeats
    };
    self.postMessage({
        'polygons': JSON.stringify(fpolygons),
        'center': JSON.stringify([lat, lng])
    });
}

function generate3DGeoms(allFeaturesList, genstreets) {;
    var allFeaturesList = JSON.parse(allFeaturesList);
    var threeDOutput = generateFinal3DGeoms(allFeaturesList, genstreets);

}

self.onmessage = function(e) {
    generate3DGeoms(e.data.allFeaturesList, e.data.genstreets);
}