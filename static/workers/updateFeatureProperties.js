function update_properties(allFeaturesList, updated_properties) {
    
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
        var feature_id = curfeatprop.id;
        
        if(updated_feature_ids.includes(feature_id)) { // this feature is interesting            
            for (let index = 0; index < update_prop.length; index++) {
                const cur_element = update_prop[index];
                let max_height = cur_element['height'];                
                if (cur_element['id'] === feature_id){
                    curfeatprop.height = max_height;
                    var levels = Math.round(max_height / 3.2);
                    curfeatprop.levels = levels;
                    break;
                }                
            } 
            af[d].properties = curfeatprop;
        }
        updated_features.features.push(af[d]);
        counter +=1;      

        self.postMessage({
            'percentcomplete': parseInt((100 * counter) / fullproc),
            'mode': 'status',
        });
    }

    self.postMessage({
        'polygons': JSON.stringify(updated_features)
    });
}

self.onmessage = function(e) {
    update_properties(e.data.allFeaturesList, e.data.updated_properties);
}