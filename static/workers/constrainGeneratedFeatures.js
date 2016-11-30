function constrainFeatures(allFeaturesList, selectedsystems, showstreets) {
    // constrain output ot only features in the list. 
    var constraintedFeatures = { "type": "FeatureCollection", "features": [] };
    var allFeatures = JSON.parse(allFeaturesList);
    var selectedsystems = JSON.parse(selectedsystems);
    var af = allFeatures.features;
    var featlen = af.length;
    var counter = 0;
    var fullproc = featlen;
    for (var d = 0; d < featlen; d++) {
        var curfeatprop = af[d].properties;
        var curFeatSys = curfeatprop.sysname;
        var isSteet = curfeatprop.isSteet;
        if (isSteet && showstreets) {
            constraintedFeatures.features.push(af[d]);
        }
        else {
            if (selectedsystems.indexOf(curFeatSys) > -1) {
                constraintedFeatures.features.push(af[d]);
            }
        }
        counter += 1;
        self.postMessage({
            'percentcomplete': parseInt((100 * counter) / fullproc),
            'mode': 'status',
        });
    }

    self.postMessage({
        'polygons': JSON.stringify(constraintedFeatures)
    });
}

self.onmessage = function (e) {
    constrainFeatures(e.data.allFeaturesList, e.data.selectedsystems, e.data.showstreets);
}