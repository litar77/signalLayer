
import {INITIAL_VIEW_STATE,SoScene} from './scene/soScene.js'

export const scene = new SoScene({
  initialViewState: INITIAL_VIEW_STATE,
  controller: true});

scene.open("new",1);
scene.addSignalLayer();
// scene.addScatterLayer();
// scene.addRingLayer();
// scene.addRayLayer();
// scene.addColumnLayer();

if (window.Worker) {
  let signalWorker = new Worker("signalListener.js");

  signalWorker.onmessage = function (oEvent) {
    
    for(const sigpos of oEvent.data)
    {
      let {position}=sigpos;
      // console.log("Worker received : " + position);
      scene.pushSignal(position);
    }
    
  };

  signalWorker.postMessage("start");

}else {

	console.log('Your browser doesn\'t support web workers.')
}

/*
// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const COUNTRIES =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson'; //eslint-disable-line
const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';


export const deck = new Deck({
  initialViewState: INITIAL_VIEW_STATE,
  controller: true,
  layers: [
  
   
    new GeoJsonLayer({
      id: 'base-map',
      // data: COUNTRIES,
      data: WATERREGION,
      // Styles
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      opacity: 0.4,
      getLineDashArray: [3, 3],
      getLineColor: [60, 60, 60],
      getFillColor: [200, 200, 200]
    }),
    new GeoJsonLayer({
      id: 'airports',
      data: BOUNDARY,
      // Styles
      filled: true,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 2000,
      getRadius: f => 11 - f.properties.scalerank,
      getFillColor: [200, 0, 80, 180],
      // Interactive props
      pickable: true,
      autoHighlight: true,
      onClick: info =>
        // eslint-disable-next-line
        info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
    }),    
    new ArcLayer({
      id: 'arcs',
      data: AIR_PORTS,
      dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
      // Styles
      getSourcePosition: f => [-0.4531566, 51.4709959], // London
      getTargetPosition: f => f.geometry.coordinates,
      getSourceColor: [0, 128, 200],
      getTargetColor: [200, 0, 80],
      getWidth: 1
    })
    
  ]
});
*/
// For automated test cases
/* global document */
document.body.style.margin = '0px';


// eslint-disable-next-line import/named
