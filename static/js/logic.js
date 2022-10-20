    const url_quakes = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
    const url_plates = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

    var baseMap;
    var basemaps;    
    var overlays;
    var streetLayer;
    var greyscaleLayer;
    var topoLayer;
    var watercolorLayer;
    var platesLayer;
    var quakesLayer;

    var colordepth = [
        [10,'#00ff00','-10-10'],    // lime green 
        [30,'#99ff00','10-30'],     // light green
        [50,'#FFFF00','30-50'],     // yellow
        [70,'#ff9900','50-70'],     // orange
        [90,'#FF3300','70-90'],     // red orange
        [91,'#FF0000','90+']]       // bright red

    // --------------------------------------------------------------------------------
    function init()
    {
        buildLayers();
        buildOverlays();
        buildBasemaps();
        buildLegend(baseMap);
    };

    // --------------------------------------------------------------------------------
    function buildLayers()
    {
        // street layer
        streetLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        // greyscale layer
        greyscaleLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', { maxZoom: 20,
            attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        });

        // topography layer
        topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });

        // toon layer
        watercolorLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd', minZoom: 1, maxZoom: 16, ext: 'jpg'
        });

        // plates layer
        platesLayer = new L.layerGroup();

        // quakes layer
        quakesLayer = new L.layerGroup();
    }

     // --------------------------------------------------------------------------------
    function buildOverlays()
    {
        d3.json(url_plates).then(function(plate_data) {              
            L.geoJson(plate_data,{ color: 'white', weight: 5 }).addTo(platesLayer);            
        });

        d3.json(url_quakes).then(function(quakes_data) {              
            load_markers(quakes_data.features)
        });

        overlays = {
            '<span style=font-size:15px>Techtonic Plates</span>': platesLayer,
            '<span style=font-size:15px>Earthquake Data</span>': quakesLayer};       
    }

    // --------------------------------------------------------------------------------
    function buildBasemaps()
    {
        // define maps
        basemaps = {
            '<span style=font-size:15px>Greyscale</span>': greyscaleLayer,
            '<span style=font-size:15px>Watercolor</span>': watercolorLayer,            
            '<span style=font-size:15px>Topography</span>': topoLayer,
            '<span style=font-size:15px>Street</span>': streetLayer};

        // map object with default
        baseMap = L.map("map", { center: [36.00, -100.00], zoom: 5, layers:[streetLayer]});    
        
        // bind layers
        L.control.layers(basemaps, overlays, {
            collapsed: false,
            position: 'topright'
        }).addTo(baseMap);
    }

     // --------------------------------------------------------------------------------   
     function load_markers(features) 
    {
        console.log(features);
        for(var i=0; i < features.length; i++)
        {
            longitude = features[i].geometry.coordinates[1];
            latitude = features[i].geometry.coordinates[0];            
            depth = features[i].geometry.coordinates[2];

            property = features[i].properties
            magnitude = property.mag

            marker = L.circle([longitude, latitude], {
                opacity: 4,
                fillOpacity: 0.5,                
                color: 'black',
                fillColor: getColor(depth),
                radius: magnitude * 9000 + 1000,
                stroke: true,                
                weight: 0.2
            })
            .addTo(quakesLayer);

            marker.bindPopup(`<h2>${property.place}</h2><h3>Magnitude: ${magnitude}</h3><h3>Depth: ${depth} km</h3>`);
        }
    }

    function getColor(val) {
        ret_val = colordepth[0][1]; // lime green default
                
        for(var i = colordepth.length -1; i >= 0; i--)
        {
            depth = colordepth[i][0];
            color = colordepth[i][1];

            if(val >= depth)
            {   
                ret_val = color;
                return ret_val;
            }
        }
        return ret_val;
      }

    function buildLegend(baseMap) {
        // build html table legend
        var legend = L.control({position: 'bottomright'});
        var div = L.DomUtil.create('table', 'depth_legend');

        legend.onAdd = function () {    
            for(var i = 0; i < colordepth.length; i++)
            {
                color = colordepth[i][1];                
                descript = colordepth[i][2];

                div.innerHTML += `<tr style=font-size:15px><td bgcolor=${color}>&nbsp;&nbsp;&nbsp;</td><td align = right><b>${descript} km</b></td></tr>`
            }
            return div;;}

        legend.addTo(baseMap);
    }

    init();