function update_properties(allFeaturesList, updated_properties) {
    const updated_features = { "type": "FeatureCollection", "features": [] };
    const allFeatures = JSON.parse(allFeaturesList);
    const update_prop = JSON.parse(updated_properties);
    const updated_feature_ids = new Set(update_prop.map(value => value.id));
    const af = allFeatures.features;
    const featlen = af.length;

    let counter = 0;

    const updateFeatureProperties = (feature, updateData) => {
        const max_height = updateData.height;
        feature.properties.height = max_height;
        feature.properties.levels = Math.round(max_height / 3.2);
    };

    af.forEach(feature => {
        const feature_id = feature.properties.id;

        if (updated_feature_ids.has(feature_id)) {
            const updateData = update_prop.find(item => item.id === feature_id);
            if (updateData) {
                updateFeatureProperties(feature, updateData);
            }
        }

        updated_features.features.push(feature);
        counter++;

        self.postMessage({
            'percentcomplete': Math.floor((100 * counter) / featlen),
            'mode': 'status',
        });
    });

    self.postMessage({
        'polygons': JSON.stringify(updated_features)
    });
}

self.onmessage = function(e) {
    update_properties(e.data.allFeaturesList, e.data.updated_properties);
}