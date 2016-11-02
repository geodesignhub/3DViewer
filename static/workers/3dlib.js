importScripts('../js/turfjs/turf.min.js');


var COMBuilding = function() {
    // this.name = name;
    const gridsize = 0.03;
    const elevationoffset = 10;
    const footprintsize = 0.015;
    const comHeights = [14, 25, 30, 22, 28];
    const units = 'kilometers';
    const bufferWidth = gridsize - 0.01; //30 meter buffer
    const nearestSearch = [0, 1, 2];
    var featProps;
    var featExtent;
    this.genGrid = function(curFeat) {
        featProps = curFeat.properties;
        featExtent = turf.bbox(curFeat);
        var diagJSON = {
            "type": "FeatureCollection",
            "features": [curFeat]
        };
        var grid = turf.pointGrid(featExtent, gridsize, units);
        var ptsWithin = turf.within(grid, diagJSON);
        return [ptsWithin, featExtent];
    };


    this.generateBuildingFootprints = function(ptsWithin) {
        var allGeneratedFeats = [];
        var color = featProps.color;
        var systag = featProps.systag;
        var sysname = featProps.sysname;
        var ptslen = ptsWithin.features.length;
        var alreadyAdded = { "type": "FeatureCollection", "features": [] };
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
                        var height = elevationoffset + comHeights[Math.floor(Math.random() * comHeights.length)];
                        var p = {
                            'height': height,
                            'color': "#d0d0d0",
                            'roofColor': color,
                            'sysname':sysname
                        };
                        bldg.properties = p;
                        alreadyAdded.features.push(bldg);
                        allGeneratedFeats.push(bldg);
                    }
                }
                // put the list in the seen one 
                // build a bbounds polygon
            } else {
                var buffered = turf.buffer(curPt, bufferWidth, units); // buffer 48 meters
                var bds = turf.bbox(buffered); // get the extent of the buffered features
                var bfrdextPlgn = turf.bboxPolygon(bds);
                var bldgfootprint = 0.015;
                var centrepoint = turf.centroid(bfrdextPlgn);
                var bldg = turf.buffer(centrepoint, bldgfootprint, units);
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
                    var height = elevationoffset + comHeights[Math.floor(Math.random() * comHeights.length)];

                    var chosenValue = Math.random() < 0.5 ? true : false;
                    var chosenValue = true;
                    if (chosenValue) {
                        var p = {
                            'height': height,
                            'color': "#d0d0d0",
                            'roofColor': color,
                            'sysname':sysname
                        };
                        bpoly.properties = p;
                        alreadyAdded.features.push(bpoly);
                        allGeneratedFeats.push(bpoly);

                    }
                }
            }
        }
        return allGeneratedFeats;
    }
};

var LDHousing = function() {
    // this.name = name;
    const density = 30; // dwellings / hectare
    const buildingsperhectare = 20;
    const gridsize = 0.04;
    const footprintsize = 0.012;
    const ldhheights = [1, 2, 3]; // in meters 
    const units = 'kilometers';
    const elevationoffset = 10;

    var featProps;
    var featExtent;

    this.genGrid = function(curFeat) {
        featProps = curFeat.properties;
        featExtent = turf.bbox(curFeat);
        var diagJSON = {
            "type": "FeatureCollection",
            "features": [curFeat]
        };
        var grid = turf.pointGrid(featExtent, gridsize, units);
        var ptsWithin = turf.within(grid, diagJSON);
        return [ptsWithin, featExtent];
    };

    this.generateBuildingFootprints = function(ptsWithin) {

        var allGeneratedFeats = [];
        var color = featProps.color;
        var systag = featProps.systag;
        var sysname = featProps.sysname;
        var ptslen = ptsWithin.features.length;
        var bufferWidth = gridsize - 0.01; //30 meter buffer

        // if it is HDH type feature
        for (var k = 0, ptslen = ptsWithin.features.length; k < ptslen; k++) {
            var curPt = ptsWithin.features[k];
            var buffered = turf.buffer(curPt, bufferWidth, units); // buffer 48 meters
            var bds = turf.bbox(buffered); // get the extent of the buffered features
            var bfrdextPlgn = turf.bboxPolygon(bds);
            var bldgfootprint = 0.015;
            var centrepoint = turf.centroid(bfrdextPlgn);
            var bldg = turf.buffer(centrepoint, bldgfootprint, units);
            var bdgply = turf.bbox(bldg); // get the extent of the buffered features
            var bpoly = turf.bboxPolygon(bdgply);
            var height = elevationoffset + ldhheights[Math.floor(Math.random() * ldhheights.length)];

            var p = {
                'height': height,
                'color': "#d0d0d0",
                'roofColor': color,
                'sysname':sysname
            };
            bpoly.properties = p;
            allGeneratedFeats.push(bpoly);

        }
        return allGeneratedFeats;
    }
};

var HDHousing = function() {
    // this.name = name;
    const density = 80; // dwellings / hectare
    const buildingsperhectare = 2;
    const gridsize = 0.05; // changes the maximum area
    const footprintsize = 0.015;
    const heights = [36, 60, 90]; // in meters 
    const units = 'kilometers';
    const elevationoffset = 10;
    var featProps;

    this.generateSquareGridandConstrain = function(featureGeometry) {
        var featarea = turf.area(featureGeometry);
        var numberofextrusions = Math.round((featarea * 0.0001) * buildingsperhectare);
        featProps = featureGeometry.properties;
        var featExtent = turf.bbox(featureGeometry);
        var sqgrid = turf.squareGrid(featExtent, gridsize, units);
        // constrain grid.
        var constrainedgrid = { "type": "FeatureCollection", "features": [] };
        var sqfeatslen = sqgrid.features.length;
        // number of extrusions is counted. 
        // console.log(numberofextrusions, sqfeatslen);
        var ratio = (numberofextrusions / sqfeatslen);
        var extrudedfeaturescount = 0;
        if (ratio < 0.20 || numberofextrusions < 15) {
            for (var x = 0; x < sqfeatslen; x++) {
                if (extrudedfeaturescount < numberofextrusions) {
                    var cursqfeat = sqgrid.features[x];
                    var ifeat = turf.intersect(cursqfeat, featureGeometry);
                    if (ifeat) {
                        constrainedgrid.features.push(ifeat);
                    } else {
                        constrainedgrid.features.push(cursqfeat);
                    }
                    extrudedfeaturescount += 1;
                }
            }
        } else {
            var gridStore = {};
            var gridid = 0;
            for (var x1 = 0; x1 < sqfeatslen; x1++) {
                var cursqgrid = sqgrid.features[x1];
                gridStore[gridid] = cursqgrid;
                gridid += 1;
            }
            while (extrudedfeaturescount < numberofextrusions + 1) {
                var randomgridid = Math.floor(Math.random() * (sqfeatslen - 0 + 1)) + 0;
                // get the id from gridStore
                var cursqfeat = gridStore[randomgridid];
                // have the feature
                var ifeat = turf.intersect(cursqfeat, featureGeometry);
                if (ifeat) {
                    constrainedgrid.features.push(ifeat);
                } else {
                    constrainedgrid.features.push(cursqfeat);
                }
                extrudedfeaturescount += 1;
            }
        }
        return constrainedgrid;
    };

    this.generateBuildings = function(constrainedgrid) {
        var consgridlen = constrainedgrid.features.length;
        var generatedGeoJSON = { "type": "FeatureCollection", "features": [] };
        // find centroid
        var extrusionconter = 0;
        for (var k1 = 0; k1 < consgridlen; k1++) {
            var curconsfeat = constrainedgrid.features[k1];
            var curarea = turf.area(curconsfeat);
            if (curarea > 2000) { //max area is 2500 gridsize squared
                var chosenValue = Math.random() > 0.6 ? true : false;
                if (chosenValue) {
                    var centroid = turf.centroid(curconsfeat);
                    var bufferedCentroid = turf.buffer(centroid, footprintsize, 'kilometers');
                    var bbox = turf.bbox(bufferedCentroid);
                    var bboxpoly = turf.bboxPolygon(bbox);
                    var height = elevationoffset + heights[Math.floor(Math.random() * heights.length)];
                    var props = {
                        "height": height,
                        "color": "#d0d0d0",
                        "roofColor": featProps.color,
                        'sysname':featProps.sysname
                    };
                    bboxpoly.properties = props;
                    generatedGeoJSON.features.push(bboxpoly);
                }
            }
        }
        return generatedGeoJSON;
    }
};

var MXDBuildings = function() {
    const density = 40; // dwellings per hectare.
    const outerringradius = 0.04;
    const middleringradius = 0.02;
    const innerringradius = 0.01;
    // this.name = name;
    const gridsize = 0.08;
    const elevationoffset = 10;
    const innergridsize = 0.02;

    const heights = [9, 12, 8, 11]; // in meters 
    const units = 'kilometers';

    var featProps;
    this.generateSquareGridandConstrain = function(featureGeometry) {
        featProps = featureGeometry.properties;
        var featExtent = turf.bbox(featureGeometry);
        var sqgrid = turf.squareGrid(featExtent, gridsize, units);

        // constrain grid.
        var constrainedgrid = { "type": "FeatureCollection", "features": [] };
        var sqfeatslen = sqgrid.features.length;

        for (var x = 0; x < sqfeatslen; x++) {
            var cursqfeat = sqgrid.features[x];

            var ifeat = turf.intersect(cursqfeat, featureGeometry);

            if (ifeat) {
                constrainedgrid.features.push(ifeat);
            } else {
                constrainedgrid.features.push(cursqfeat);
            }
        }

        return constrainedgrid;
    };

    this.generateBuildings = function(constrainedgrid) {
        var consgridlen = constrainedgrid.features.length;
        var generatedGeoJSON = { "type": "FeatureCollection", "features": [] };
        // find centroid
        for (var k1 = 0; k1 < consgridlen; k1++) {
            var curconsfeat = constrainedgrid.features[k1];
            var curarea = turf.area(curconsfeat);
            var center = turf.centroid(curconsfeat);

            if (curarea > 6300) { //max area is 3600 need entire parcel. 
                var cv = Math.random() < 0.5 ? true : false;
                if (cv) {
                    var outerring = turf.buffer(center, outerringradius, units);
                    var innerring = turf.buffer(center, innerringradius, units);
                    var middlering = turf.buffer(center, middleringradius, units);
                    // get bbox
                    var outerringbbox = turf.bbox(outerring);
                    var innerringbbox = turf.bbox(innerring);
                    var middleringbbox = turf.bbox(middlering);
                    //get bbox polygon
                    var outerringpoly = turf.bboxPolygon(outerringbbox);
                    var innerringpoly = turf.bboxPolygon(innerringbbox);
                    var middleringpoly = turf.bboxPolygon(middleringbbox);

                    //erase inner from outerring to get hybrid hole
                    var hybridhole = turf.difference(outerringpoly, innerringpoly);

                    // erease middle from hybrid hole
                    var buildingpoly = turf.difference(hybridhole, middleringpoly);
                    var height = elevationoffset + heights[Math.floor(Math.random() * heights.length)]
                    var props = {
                        "height": height,
                        "color": "#d0d0d0",
                        "roofColor": featProps.color,
                        'sysname':featProps.sysname
                    };
                    buildingpoly.properties = props;

                    generatedGeoJSON.features.push(buildingpoly);
                }
                // generate square grid
                // var sqrgrid = turf.squareGrid(outerringbbox, innergridsize, units);
                // // interserct squre grid with hole. 
                // console.log(JSON.stringify(buildingpoly));
                // // for each feature in the hole. 
                // for (var j1 = 0; j1 < sqrgrid.features.length; j1++) {
                //     var cursqgrid = sqrgrid.features[j1];


                //     var blgdfeat = turf.intersect(buildingpoly, cursqgrid);
                //     if (blgdfeat) {
                //         var area = turf.area(blgdfeat); // max area is 400
                //         // var cv = Math.random() < 0.5 ? true : false;
                //         if (area > 300) {
                //             var props = {
                //                 "height": heights[Math.floor(Math.random() * heights.length)],
                //                 "color": "#d0d0d0",
                //                 "roofColor": featProps.color
                //             };
                //             blgdfeat.properties = props;
                //             generatedGeoJSON.features.push(blgdfeat);

                //         }
                //     }
                // }
            }
        }
        return generatedGeoJSON;
    }

}

var LABBuildings = function() {
    var reqtype;
    var labHeights = [10, 15];
    const nearestSearch = [0, 1, 2];
    const units = 'kilometers';
    const cellWidth = 0.03;
    const elevationoffset = 10;
    var availablePts = {};
    var featProps;
    var featExtent;


    this.genGrid = function(curFeat) {
        featProps = curFeat.properties;
        featExtent = turf.bbox(curFeat);
        var diagJSON = {
            "type": "FeatureCollection",
            "features": [curFeat]
        };
        var grid = turf.pointGrid(featExtent, cellWidth, units);
        var ptsWithin = turf.within(grid, diagJSON);
        return [ptsWithin, featExtent];
    };

    this.generateBuildingFootprints = function(ptsWithin) {
        var allGeneratedFeats = [];
        var color = featProps.color;
        var roofColor = color;
        var systag = featProps.systag;
        var sysname = featProps.sysname;
        var alreadyAdded = { "type": "FeatureCollection", "features": [] };
        // if it is HDH type feature
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

                        var height = elevationoffset + labHeights[Math.floor(Math.random() * labHeights.length)];

                        var p = {
                            'height': height,
                            'color': "#d0d0d0",
                            'roofColor': color,
                            'sysname':sysname
                        };
                        bldg.properties = p;
                        alreadyAdded.features.push(bldg);
                        allGeneratedFeats.push(bldg);
                    }
                }
            }

        }
        return allGeneratedFeats;
    }
};

var SMBBuildings = function() {
    var reqtype;
    var smbHeights = [2, 3, 5, 6, 7, 10];
    const gridsize = 0.04;
    const footprintsize = 0.012;
    const units = 'kilometers';
    const nearestSearch = [0, 1, 2];
    var featProps;
    const elevationoffset = 10;
    var featExtent;

    const bldgfootprint = 0.015;
    this.genGrid = function(curFeat) {
        featProps = curFeat.properties;
        featExtent = turf.bbox(curFeat);
        var diagJSON = {
            "type": "FeatureCollection",
            "features": [curFeat]
        };
        var grid = turf.pointGrid(featExtent, cellWidth, units);
        var ptsWithin = turf.within(grid, diagJSON);
        return [ptsWithin, featExtent];
    };

    this.generateBuildingFootprints = function(ptsWithin) {
        for (var k = 0, ptslen = ptsWithin.features.length; k < ptslen; k++) {
            var chosenValue = Math.random() < 0.5 ? true : false;

            if (chosenValue) {
                var curPt = ptsWithin.features[k];
                var buffered = turf.buffer(curPt, bufferWidth, units); // buffer 48 meters
                var bds = turf.bbox(buffered); // get the extent of the buffered features
                var bfrdextPlgn = turf.bboxPolygon(bds);
                var centrepoint = turf.centroid(bfrdextPlgn);
                var bldg = turf.buffer(centrepoint, bldgfootprint, units);
                var bdgply = turf.bbox(bldg); // get the extent of the buffered features
                var bpoly = turf.bboxPolygon(bdgply);
                var height = elevationoffset + smbHeights[Math.floor(Math.random() * smbHeights.length)];

                var p = {
                    'height': height,
                    'color': "#d0d0d0",
                    'roofColor': color,
                    'sysname':featProps.sysname
                };
                bpoly.properties = p;
                allGeneratedFeats.push(bpoly);

            }
        }

    }
    return allGeneratedFeats;

};
var StreetsHelper = function() {

    this.genStreetsGrid = function(pointsWithin, extent) {
        // This module generates streets. given a grid of points. 
        var rows = [];
        var elevationoffset = 10;
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
                var height = elevationoffset + 0.1;
                street.features[0].properties = {
                    "color": "#202020",
                    "roofColor": "#202020",
                    "height": height
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
                    var height = elevationoffset + 0.1;
                    street.features[0].properties = {
                        "color": "#202020",
                        "roofColor": "#202020",
                        "height": height
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
    this.filterStreets = function(streetgrid, inputFeats) {
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
}


function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
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

function generatePolicyFeatures(curFeat) {

    const elevationoffset = 10;

    function getCW(d) {
        return d > 10000000 ? 1 :
            d > 6000000 ? 0.75 :
            d > 5000000 ? 0.5 :
            d > 3000000 ? 0.3 :
            d > 2000000 ? 0.15 :
            d > 1000000 ? 0.08 :
            0.04;
    }
    var policyFeats = [];
    var fe = turf.bbox(curFeat);
    var area = Math.round(turf.area(curFeat));
    var cw = getCW(area);
    var unit = 'kilometers';
    var dJSON = {
        "type": "FeatureCollection",
        "features": [curFeat]
    };
    // make the grid of 50 meter points
    var grd = turf.pointGrid(fe, cw, unit);
    var pW = turf.within(grd, dJSON);
    var pwLen = pW.features.length;
    var height = elevationoffset + 0.01;
    var prop = {
        "roofColor": curFeat.properties.color,
        "height": height
    }
    for (var l1 = 0; l1 < pwLen; l1++) {
        var curptwithin = pW.features[l1];
        var bufFeat = turf.buffer(curptwithin, 0.0075, 'kilometers');
        bufFeat.properties = prop;
        policyFeats.push(bufFeat);
    }
    return policyFeats;
}

function generateFinal3DGeoms(constraintedModelDesigns, genstreets, existingroads) {

    const elevationoffset = 10;
    var genstreets = (genstreets === 'false') ? false : true;
    var whiteListedSysName = ['HDH', 'LDH', 'IND', 'COM', 'COMIND', 'HSG', 'HSNG', 'MXD'];
    var finalGJFeats = [];
    // get the center of the design so that the map once returned can be recentered.
    var centerPt = turf.center(constraintedModelDesigns);
    var lat = centerPt.geometry.coordinates[1];
    var lng = centerPt.geometry.coordinates[0];
    // iterate over the features.
    var curFeats = constraintedModelDesigns.features;

    var flen = curFeats.length;

    var fullproc = flen;
    var counter = 0;
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
                var height = elevationoffset + 2;
                curlineFeat.properties = {
                    "color": curFeat.properties.color,
                    "roofColor": curFeat.properties.color,
                    "sysname":curFeat.properties.sysname,
                    "height": height
                };

                finalGJFeats.push(curlineFeat);
            }
        } else if (curFeat.geometry.type === "Polygon") {

            var featProps = curFeat.properties;
            if (whiteListedSysName.indexOf(curFeatSys) >= 0) { // system is whitelisted
                if (curFeat.properties.areatype === 'project') {
                    //100 meter cell width
                    if (featProps.sysname === 'HDH') {
                        var hdh = new HDHousing();
                        var constrainedgrid = hdh.generateSquareGridandConstrain(curFeat);
                        var bldgs = hdh.generateBuildings(constrainedgrid);
                        for (var k2 = 0; k2 < bldgs.features.length; k2++) {
                            finalGJFeats.push(bldgs.features[k2]);
                        }
                    }
                    if (featProps.sysname === 'MXD') {
                        var mxd = new MXDBuildings();
                        var mxdgrid = mxd.generateSquareGridandConstrain(curFeat);
                        // console.log(JSON.stringify(mxdgrid));
                        var mxdbld = mxd.generateBuildings(mxdgrid);
                        // console.log(JSON.stringify(mxdbld));
                        for (var k3 = 0; k3 < mxdbld.features.length; k3++) {
                            finalGJFeats.push(mxdbld.features[k3]);
                        }
                    } else if (featProps.sysname === 'LDH') {
                        var ldh = new LDHousing();
                        var p = ldh.genGrid(curFeat);
                        var ptsWithin = p[0];
                        var featExtent = p[1];
                        var bldgs = ldh.generateBuildingFootprints(ptsWithin);
                        var ldhstreets = new StreetsHelper();
                        var ldhstreetFeatureCollection = ldhstreets.genStreetsGrid(ptsWithin, featExtent);
                        var ldhfinalFeatures = ldhstreets.filterStreets(ldhstreetFeatureCollection, bldgs);
                        if (existingroads) {
                            ldhfinalFeatures = ldhstreets.filterStreets(existingroads, ldhfinalFeatures);
                        }
                        if (genstreets) {
                            ldhfinalFeatures.push.apply(ldhfinalFeatures, ldhstreetFeatureCollection.features);
                        }
                        for (var k1 = 0; k1 < ldhfinalFeatures.length; k1++) {
                            finalGJFeats.push(ldhfinalFeatures[k1]);
                        }
                    } else if ((featProps.sysname === 'COM') || (featProps.sysname === 'COMIND')) {
                        var com = new COMBuilding();
                        var comp = com.genGrid(curFeat);
                        var comptsWithin = comp[0];
                        var comfeatExtent = comp[1];
                        var combldgs = com.generateBuildingFootprints(comptsWithin);
                        var comstreets = new StreetsHelper();
                        var comstreetFeatureCollection = comstreets.genStreetsGrid(comptsWithin, comfeatExtent);
                        var comfinalFeatures = comstreets.filterStreets(comstreetFeatureCollection, combldgs);
                        if (existingroads) {
                            comfinalFeatures = comstreets.filterStreets(existingroads, comfinalFeatures);
                        }
                        if (genstreets) {
                            comfinalFeatures.push.apply(comfinalFeatures, comstreetFeatureCollection.features);
                        }
                        for (var k1 = 0; k1 < comfinalFeatures.length; k1++) {
                            finalGJFeats.push(comfinalFeatures[k1]);
                        }
                    }
                } else if (curFeat.properties.areatype === 'policy') { // whitelisted policy
                    var policyF = generatePolicyFeatures(curFeat);
                    for (var pf = 0; pf < policyF.length; pf++) {
                        finalGJFeats.push(policyF[pf]);
                    }
                }

            }
            // for non white listed systems that are buildings
            else if ((featProps.systag === 'Large buildings, Industry, commerce') && (featProps.areatype === 'project')) { // 

                var lab = new LABBuildings();
                var labgrid = lab.genGrid(curFeat);
                var labptsWithin = labgrid[0];
                var labfeatExtent = labgrid[1];
                var labbldgs = lab.generateBuildingFootprints(labptsWithin);

                var labstreets = new StreetsHelper();
                var labStreetsFC = labstreets.genStreetsGrid(labptsWithin, labfeatExtent);
                var labFinalFeatures = labstreets.filterStreets(labStreetsFC, labbldgs);
                if (existingroads) {
                    labFinalFeatures = labstreets.filterStreets(existingroads, labFinalFeatures);
                }
                if (genstreets) {
                    labFinalFeatures.push.apply(labFinalFeatures, labStreetsFC.features);
                }
                for (var k1 = 0; k1 < labFinalFeatures.length; k1++) {
                    finalGJFeats.push(labFinalFeatures[k1]);
                }

            } else if ((featProps.reqtype === 'Small buildings, low density housing') && (featProps.areatype === 'project')) {
                var smb = new SMBBuildings();
                var smbgrid = smb.genGrid(curFeat);
                var smbptsWithin = smbgrid[0];
                var smbfeatExtent = smbgrid[1];
                var smbbldgs = smb.generateBuildingFootprints(smbptsWithin);

                var smbStreets = genStreetsGrid(smbptsWithin, smbfeatExtent);
                var smbFinalFeatures = filterStreets(smbStreets, smbbldgs);
                if (existingroads) {
                    smbFinalFeatures = filterStreets(existingroads, smbFinalFeatures);
                }
                if (genstreets) {
                    smbFinalFeatures.push.apply(smbFinalFeatures, smbStreets.features);
                }
                for (var k1 = 0; k1 < smbFinalFeatures.length; k1++) {
                    finalGJFeats.push(smbFinalFeatures[k1]);
                }


            } else { // all systems that not buildings
                if (curFeat.properties.areatype === 'project') {
                    var height = elevationoffset + 0.01;
                    var prop = {
                        "roofColor": curFeat.properties.color,
                        "height": height,
                        "sysname":curFeat.properties.sysname
                    }
                    curFeat.properties = prop;
                    finalGJFeats.push.apply(finalGJFeats, [curFeat]);
                } else if (curFeat.properties.areatype === 'policy') {
                    var policyF = generatePolicyFeatures(curFeat);
                    for (var pf = 0; pf < policyF.length; pf++) {
                        finalGJFeats.push(policyF[pf]);
                    }
                }
            }

        }
        counter += 1;
        self.postMessage({
            'percentcomplete': parseInt((100 * counter) / fullproc),
            'mode': 'status',
        });
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

function constrainFeatures(allFeaturesList, selectedsystems) {
    // constrain output ot only features in the list. 
    var cFeats = allFeaturesList.features;
    var constraintedFeatures = { "type": "FeatureCollection", "features": [] };
    var featlen = cFeats.length;
    for (var d = 0; d < featlen; d++) {
        var curfeatprop = cFeats[d].properties;
        var curFeatSys = curfeatprop.sysname;
        if (selectedsystems.indexOf(curFeatSys) > -1) {
            constraintedFeatures.features.push(cFeats[d]);
        }
    }
    return constraintedFeatures
}

function generate3DGeoms(allFeaturesList, genstreets, existingroads, selectedsystems) {
    var allFeaturesList = JSON.parse(allFeaturesList);

    var existingroads = JSON.parse(existingroads);
    var selectedsystems = JSON.parse(selectedsystems);
    // console.log(JSON.stringify(existingroads));
    if (existingroads) {
        existingroads = bufferExistingRoads(existingroads);
    }
    var threeDOutput;
    if (selectedsystems.length > 0) {
        var constraintedFeatures = constrainFeatures(allFeaturesList, selectedsystems);
        threeDOutput = generateFinal3DGeoms(constraintedFeatures, genstreets, existingroads);
    } else {
        threeDOutput = generateFinal3DGeoms(allFeaturesList, genstreets, existingroads);
    }
}

self.onmessage = function(e) {
    generate3DGeoms(e.data.allFeaturesList, e.data.genstreets, e.data.existingroads, e.data.selectedsystems);
}