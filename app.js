
import {INITIAL_VIEW_STATE,SoScene} from './scene/soScene.js'

const bUseMapbox=true;  //是用mapbox地图，还是矢量地图
const bAddSignalLayer=true; //是否打开信号图层
const bAddTrackLayer=true;  //是否打开轨迹图层
const bExtruedBuilding=true;//是否挤压生成立体建筑，目前这种方式显示建筑效率较低，因此不提倡打开此开关

export const scene = new SoScene({
  initialViewState: INITIAL_VIEW_STATE,
  controller: true});


  if(bUseMapbox)
  {
    scene.open("mapbox");
  }else
  {
    scene.open("vector",bExtruedBuilding);
  }
  
  if(bAddSignalLayer)
  {
    scene.addSignalLayer();
  }
  
  if(bAddTrackLayer)
  {
    scene.addTrajectoryLayer();
  }
  
// scene.addLineLayer();
// scene.addScatterLayer();
// scene.addRingLayer();
// scene.addRayLayer();
// scene.addColumnLayer();

if (window.Worker) {

  let signalWorker = new Worker("signalListener.js");

  signalWorker.onmessage = function (oEvent) {

    const {msgType}=oEvent.data;
    
    if(msgType==='signal')
    {
      
      const {sigpos}=oEvent.data;

      for(const position of sigpos)
      {
        scene.pushSignal(position);
      }
    }else
    {
      const {trackingPoints}=oEvent.data;
      
      if(trackingPoints)
      {
        scene.pushTrackingPoints(trackingPoints);
      }
      
    }
    
  };

  
  //启动信号点发送线程
  if(bAddSignalLayer)
  {
    signalWorker.postMessage("startPark");
  }
  

  if(bAddTrackLayer)
  {
    //启动轨迹发送线程
    signalWorker.postMessage("stratTracking");
  }

}else{

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
document.body.style.margin = '1px';


// eslint-disable-next-line import/named
