importScripts('../js/turfjs/turf.min.js');


function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function generatePolicyFeatures(curFeat) {
    const elevationOffset = 2;
    const curFeatProps = curFeat.properties;

    const getCellWidth = (area) => {
        if (area > 10000000) return 1;
        if (area > 6000000) return 0.75;
        if (area > 5000000) return 0.5;
        if (area > 3000000) return 0.3;
        if (area > 2000000) return 0.15;
        if (area > 1000000) return 0.08;
        return 0.04;
    };

    const area = Math.round(turf.area(curFeat));
    const cellWidth = getCellWidth(area);
    const options = { units: 'kilometers' };
    const featureCollection = { type: "FeatureCollection", features: [curFeat] };
    const policyId = `plcy-${makeid()}`;
    const grid = turf.pointGrid(turf.bbox(curFeat), cellWidth, options);
    const pointsWithin = turf.within(grid, featureCollection);
    const height = elevationOffset + 0.01;

    const baseProperties = {
        color: curFeatProps.color,
        roofColor: curFeatProps.color,
        height: height,
        isStreet: 0,
        isPolicy: 1,
        sysname: curFeatProps.sysname
    };

    return pointsWithin.features.map(point => {
        const bufferedFeature = turf.buffer(point, 0.0075, options);
        bufferedFeature.properties = { ...baseProperties };
        return bufferedFeature;
    });
}
function generateFinal3DGeoms(constraintedModelDesigns) {
    const elevationOffset = 0.5;
    const whiteListedSysName = ['HDH', 'LDH', 'IND', 'COM', 'COMIND', 'HSG', 'MXD', 'MIX'];
    const finalGJFeats = [];
    const centerPt = turf.center(constraintedModelDesigns);
    const [lng, lat] = centerPt.geometry.coordinates;
    const curFeats = constraintedModelDesigns.features;
    const fullProc = curFeats.length;

    const createFeatureProps = (featProps, type, maxHeight, minHeight, levels, id) => ({
        color: featProps.color,
        roofColor: featProps.color,
        sysname: featProps.sysname,
        isStreet: 0,
        isPolicy: 0,
        type,
        height: maxHeight,
        minHeight,
        levels,
        id
    });

    const processLineString = (curFeat, featureId) => {
        const buffered = turf.buffer(curFeat, 0.005, { units: 'kilometers' });
        const lineFeatures = buffered.type === "Feature" ? [buffered] : buffered.features;

        lineFeatures.forEach(lineFeat => {
            const featId = `road-${makeid()}-${featureId}`;
            lineFeat.properties = createFeatureProps(curFeat.properties, null, elevationOffset + 0.5, elevationOffset, null, featId);
            lineFeat.properties.isStreet = 1;
            finalGJFeats.push(lineFeat);
        });
    };

    const processPolygon = (curFeat, featureId, featProps, maxHeight, minHeight) => {
        const levels = Math.round(maxHeight / 3.5);
        const featId = `bldg-${makeid()}-${featureId}`;
        const props = createFeatureProps(featProps, featProps.type || 'retail', maxHeight, minHeight, levels, featId);
        curFeat.properties = props;
        finalGJFeats.push(curFeat);
    };

    const processPolicy = (curFeat) => {
        const policyFeatures = generatePolicyFeatures(curFeat);
        finalGJFeats.push(...policyFeatures);
    };

    curFeats.forEach((curFeat, index) => {
        const featProps = curFeat.properties;
        const featureId = featProps.diagramid?.toString() || makeid();
        let maxHeight = featProps.volume_information?.max_height || 0;
        let minHeight = featProps.volume_information?.min_height || 0;

        if (curFeat.geometry.type === "LineString") {
            processLineString(curFeat, featureId);
        } else if (curFeat.geometry.type === "Polygon") {
            if (whiteListedSysName.includes(featProps.sysname)) {
                if (featProps.areatype === 'project') {
                    if (featProps.sysname === 'HDH' || featProps.sysname === 'HSNG' || featProps.sysname === 'HSG') {
                        maxHeight = maxHeight || elevationOffset + [36, 60, 90][Math.floor(Math.random() * 3)];
                        minHeight = minHeight || elevationOffset + 0.5;
                    } else if (featProps.sysname === 'MXD' || featProps.sysname === 'MIX') {
                        maxHeight = maxHeight || elevationOffset + [9, 12, 8, 11][Math.floor(Math.random() * 4)];
                        minHeight = minHeight || elevationOffset + 0.5;
                    } else if (featProps.sysname === 'LDH') {
                        maxHeight = maxHeight || elevationOffset + [1, 2, 3][Math.floor(Math.random() * 3)];
                        minHeight = minHeight || elevationOffset + 0.5;
                    } else if (featProps.sysname === 'COM') {
                        maxHeight = maxHeight || elevationOffset + [14, 25, 30, 22, 28][Math.floor(Math.random() * 5)];
                        minHeight = minHeight || elevationOffset + 0.5;
                    } else if (featProps.sysname === 'COMIND') {
                        maxHeight = maxHeight || elevationOffset + [10, 15][Math.floor(Math.random() * 2)];
                        minHeight = minHeight || elevationOffset + 0.5;
                    }
                    processPolygon(curFeat, featureId, featProps, maxHeight, minHeight);
                } else if (featProps.areatype === 'policy') {
                    processPolicy(curFeat);
                }
            } else if (featProps.systag === 'Large buildings, Industry, commerce' && featProps.areatype === 'project') {
                maxHeight = maxHeight || elevationOffset + [10, 15][Math.floor(Math.random() * 2)];
                minHeight = minHeight || elevationOffset + 0.5;
                processPolygon(curFeat, featureId, featProps, maxHeight, minHeight);
            } else if (featProps.systag === 'Small buildings, low density housing' && featProps.areatype === 'project') {
                maxHeight = maxHeight || elevationOffset + [2, 3, 5, 6, 7, 10][Math.floor(Math.random() * 6)];
                minHeight = minHeight || elevationOffset + 0.5;
                processPolygon(curFeat, featureId, featProps, maxHeight, minHeight);
            } else if (featProps.areatype === 'policy') {
                processPolicy(curFeat);
            }
        }

        self.postMessage({
            percentcomplete: Math.round((100 * (index + 1)) / fullProc),
            mode: 'status',
        });
    });

    const fpolygons = {
        type: "FeatureCollection",
        features: finalGJFeats
    };

    self.postMessage({
        polygons: JSON.stringify(fpolygons),
        center: JSON.stringify([lat, lng])
    });
}
function constrainFeatures(allFeaturesList, selectedsystems) {
    const constraintedFeatures = {
        type: "FeatureCollection",
        features: allFeaturesList.features.filter(feature =>
            selectedsystems.includes(feature.properties.sysname)
        )
    };
    return constraintedFeatures;
}

function generate3DGeoms(allFeaturesList, selectedsystems) {
    const parsedFeaturesList = JSON.parse(allFeaturesList);
    const parsedSelectedSystems = JSON.parse(selectedsystems);

    const featuresToProcess = parsedSelectedSystems.length > 0
        ? constrainFeatures(parsedFeaturesList, parsedSelectedSystems)
        : parsedFeaturesList;

    generateFinal3DGeoms(featuresToProcess);
}

self.onmessage = function (e) {
    generate3DGeoms(e.data.allFeaturesList, e.data.selectedsystems);
}