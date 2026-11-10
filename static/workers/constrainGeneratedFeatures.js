function constrainFeatures(allFeaturesList, selectedSystems, showPolicies) {
    const constrainedFeatures = { "type": "FeatureCollection", "features": [] };
    const allFeatures = JSON.parse(allFeaturesList);
    const selectedSystemsArray = JSON.parse(selectedSystems);
    const features = allFeatures.features;
    const totalFeatures = features.length;

    features.forEach((feature, index) => {
        const { sysname: currentSystem, isPolicy } = feature.properties;

        if (selectedSystemsArray.includes(currentSystem)) {
            if ((isPolicy === 1 && parseInt(showPolicies) === 1) || isPolicy === 0) {
                constrainedFeatures.features.push(feature);
            }
        }

        self.postMessage({
            'percentcomplete': Math.floor((100 * (index + 1)) / totalFeatures),
            'mode': 'status',
        });
    });

    self.postMessage({
        'polygons': JSON.stringify(constrainedFeatures)
    });
}

self.onmessage = function(e) {
    constrainFeatures(e.data.allFeaturesList, e.data.selectedsystems, e.data.showpolicies);
}