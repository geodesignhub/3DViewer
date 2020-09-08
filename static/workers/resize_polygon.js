importScripts('../js/turfjs/turf.min.js');

function scale_feature(allFeaturesList, updated_properties) {

    // constrain output ot only features in the list. 
    var updated_features = { "type": "FeatureCollection", "features": [] };
    var allFeatures = JSON.parse(allFeaturesList);
    var update_prop = JSON.parse(updated_properties);
    var updated_feature_ids = update_prop.map(value => value.id);
    var af = allFeatures.features;
    var featlen = af.length;
    var counter = 0;
    var fullproc = featlen;


    for (var d = 0; d < featlen; d++) {

        var curfeatprop = af[d].properties;
        var feature_id = af[d].id;
        let found = false;
        let poly = af[d];
        if (updated_feature_ids.includes(feature_id)) { // this feature is interesting            

            for (let index = 0; index < update_prop.length; index++) {
                const cur_element = update_prop[index];
                let new_size = cur_element['scale'];
                
                var scaledPoly = turf.transformScale(poly, parseFloat(new_size));
                scaledPoly.properties = curfeatprop;
                scaledPoly.id = feature_id;
                found = true;
            }

        }
        if (found) {
            console.log(JSON.stringify(scaledPoly));
            updated_features.features.push(scaledPoly);

        } else {
            updated_features.features.push(af[d]);
        }
        counter += 1;

        self.postMessage({
            'percentcomplete': parseInt((100 * counter) / fullproc),
            'mode': 'status',
        });
    }

    self.postMessage({
        'polygons': JSON.stringify(updated_features)
    });
}

self.onmessage = function (e) {
    scale_feature(e.data.allFeaturesList, e.data.updated_properties);
}