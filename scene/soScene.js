// Copyright (c) Dataojo Technologies, Inc.
// 相数科技 版权所有
// 作者：taody 2020.6.4
// 三维场景对象，用于加载城市三维空间数据，实现城市地理空间三维动态可视化
// import {Buffer} from '@luma.gl/core';
import {Deck} from '@deck.gl/core';
// import GL from '@luma.gl/constants';
import {PolygonLayer, GeoJsonLayer,ColumnLayer} from '@deck.gl/layers';
import SignalLayer from './signal-layer/signal-layer'
import TrajectoryLayer from './trajectory-layer/trajectory-layer'
// import SignalBuffer from './signal-layer/signal-buffer'
import {LINE_DATA,SIGNAL_DATA} from './signalData'
import SignalRingLayer from './signal-layer/signal-ring-layer'
import SignalRayLayer from './signal-layer/signal-ray-layer'
import LineLayer from './trajectory-layer/line-layer'
import mapboxgl from 'mapbox-gl';
// import {LessEqualDepth} from 'three';
// import {Deck,layerManager} from "../../node_modules/@deck.gl/core/dist.min.js"
// import {PolygonLayer, GeoJsonLayer, ArcLayer} from "./../node_modules/@deck.gl/layers/dist.min.js"

export const GROUND = [{
  contour: [
    [121.4, 31.3, 0],
    [121.4, 31.1, 0],
    [121.60, 31.1, 0],
    [121.60, 31.3, 0],
    [121.4, 31.3, 0]
  ],
  id: 1,
}]; // 地面



const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';  // 'mapbox://styles/mapbox/light-v9'
mapboxgl.accessToken = 'pk.eyJ1IjoibGl0YXIiLCJhIjoiY2thZ2h2ZWNvMDQwcjJzbHN2ZWF5cG53cyJ9.JccA8XgHr0953SgMLpiUtg';


const STARTTIME=Date.now();
const DEFAULT_ORIGIN_COLOR = [100, 100, 160, 10];
const DEFAULT_DESTINATION_COLOR = [255, 100, 100, 255];


const BOUNDARY = './mapdata/boundary_county_R_R.geojson'; // 行政边界
const WATERREGION = './mapdata/water_R_R.geojson'; // 水系
const BUILDING = './mapdata/building_R_R.geojson'; // 建筑
const VEGETATION = './mapdata/vegetation_R_R.geojson'; // 绿地
const RAOD_1 = './mapdata/road_L_1_L.geojson'; // 一级道路
const RAOD_2 = './mapdata/road_L_2_L.geojson'; // 二级道路

// const binaryData = new Float32Array([121.5343246459961, 31.210847854614258, 0.0,121.54065704345703,31.21770668029785,0.0,
//   121.53236389160156,31.216413497924805,0.0,121.53137969970703,31.217756271362305,0.0,121.53059387207031,31.219308853149414,0.0]);

const COLOR_SCALE = [
  // negative
  [65, 182, 196],
  [127, 205, 187],
  [199, 233, 180],
  [237, 248, 177],

  // positive
  [255, 255, 204],
  [255, 237, 160],
  [254, 217, 118],
  [254, 178, 76],
  [253, 141, 60],
  [252, 78, 42],
  [227, 26, 28],
  [189, 0, 38],
  [128, 0, 38]
];

let counter = 0;

export const INITIAL_VIEW_STATE = {
  latitude: 31.210022,
  longitude: 121.52995,
  zoom: 15,
  bearing: 0,
  pitch: 60
};

function colorScale(x) {
  const i = Math.round(x / 7);

  // return COLOR_SCALE[i] || COLOR_SCALE[COLOR_SCALE.length - 1];
  return [50 + 25 * i, 50 + 20 * i, 50 + 25 * i];
}


export class SoScene {

  constructor(props) {

    this.props = {};
    this.count = counter++; // Keep track of how many sccene instances you are generating
    this._singalLayer = null;
    this._trajectoryLayer=null;

    // this._ptLayer = null;

    this._deck = new Deck({
      initialViewState: INITIAL_VIEW_STATE,
      controller: true,
      canvas: 'deck-canvas',
      width: '100%',
      height: '100%',
    })
  }

  open(mapType) {

    if(mapType==='mapbox')
    {
      this._map = new mapboxgl.Map({
        container: 'map',
        style: MAP_STYLE,
        // Note: deck.gl will be in charge of interaction and event handling
        interactive: false,
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        bearing: INITIAL_VIEW_STATE.bearing,
        pitch: INITIAL_VIEW_STATE.pitch
      });

      if(this._deck)
      {
                
        const onViewStateChange=({viewState}) => {
          this._map.jumpTo(
            {
              center: [viewState.longitude, viewState.latitude],
              zoom: viewState.zoom,
              bearing: viewState.bearing,
              pitch: viewState.pitch
            }
          );
        };

        this._deck.setProps({onViewStateChange});

      }

    }else if(mapType==='vector'){

      const layersAdd = [

        // 0、 加载地面
        new PolygonLayer({
          id: 'ground-layer',
          data: GROUND,
          pickable: true,
          stroked: true,
          filled: true,
          wireframe: true,
          lineWidthMinPixels: 1,
          opacity: 0.5,
          getPolygon: x => x.contour,
          getElevation: 0,
          getFillColor: [30, 30, 30],
          getLineColor: [80, 80, 80],
          getLineWidth: 1,

        }),
   
        // 1、加载行政区界面图层
        new GeoJsonLayer({
          id: 'boundary',
          data: BOUNDARY,
          // Styles
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          opacity: 0.8,
          getLineColor: [60, 60, 60],
          getFillColor: [100, 100, 100]
        }),

        // 2、加载水系图层
        new GeoJsonLayer({
          id: 'water',
          data: WATERREGION,
          // Styles
          stroked: false,
          filled: true,
          lineWidthMinPixels: 2,
          opacity: 0.4,
          getLineColor: [60, 160, 60],
          getFillColor: [60, 80, 200]
        }),


        // 3、加载绿地图层
        new GeoJsonLayer({
          id: 'vegetation',
          data: VEGETATION,
          // Styles
          stroked: false,
          filled: true,
          lineWidthMinPixels: 2,
          opacity: 0.4,
          getLineColor: [80, 200, 80],
          getFillColor: [80, 200, 80]
        }),

        // 4、加载道路图层
        new GeoJsonLayer({
          id: 'road1',
          data: RAOD_1,
          // Styles
          stroked: false,
          filled: true,
          lineWidthMinPixels: 5,
          opacity: 0.4,
          getLineColor: [30, 30, 30],
        }),

        // 5、加载道路图层
        new GeoJsonLayer({
          id: 'road2',
          data: RAOD_2,
          // Styles
          stroked: false,
          filled: true,
          lineWidthMinPixels: 2,
          opacity: 0.4,
          getLineColor: [80, 80, 80],
        }),


        // 6、加载建筑图层
        new GeoJsonLayer({
          id: 'building',
          data: BUILDING,
          // Styles
          extruded: true,
          wireframe: false,

          getElevation: f => f.properties.FLOOR * 1.5,
          getFillColor: f => colorScale(f.properties.FLOOR),
          getLineColor: [255, 255, 255],

          pickable: true,
          stroked: false,
          filled: true,
          extrue: true,
          lineWidthMinPixels: 2,
          opacity: 0.8,

        }),

      ];

      if (this._deck) {
        // let newlayers=[];
        // newlayers=this._deck.props.layers;
        // newlayers.push(layersAdd);
        // newlayers = [].concat.apply([], newlayers);
        const {layers} = this._deck.props;
        layers.push(layersAdd);
        // this._deck.setProps({layers: layers}); 

      } else {
        console.log('No layer added');
      }
    }
  }

  addLineLayer() {

    const {layers} = this._deck.props;

    const layer=new LineLayer({
        id:'line',
        getSourcePosition:  x => x.sourcePosition,
        getSourceTime: x => x.sourceTime,
        getTargetPosition:x => x.targetPosition,
        getTargetTime: x => x.targetTime,
        getColor: DEFAULT_DESTINATION_COLOR,
        data:LINE_DATA,
        currentTime:Date.now()-STARTTIME
    });
  
    const newLayers = [];
    for (const lyr of layers) {
      if (lyr.id !== 'line') {
        newLayers.push(lyr);
      }
    }
    newLayers.push(layer);
    this._deck.setProps({
      layers: newLayers
    });

  }

  addTrajectoryLayer() {
    const {layers} = this._deck.props;
    if(!this._trajectoryLayer)
    {
      this._trajectoryLayer= new TrajectoryLayer({
        id:'trajectory',
      });
    }

    const newLayers = [];
    for (const lyr of layers) {
      if (lyr.id !== 'trajectory') {
        newLayers.push(lyr);
      }
    }
    newLayers.push(this._trajectoryLayer);
    this._deck.setProps({
      layers: newLayers
    });
  }

  addSignalLayer() {
    const {layers} = this._deck.props;
    if(!this._singalLayer)
    {
      this._singalLayer= new SignalLayer({
        id:'signal',
        ringVisible:true,
        rayVisible:true,
        radiusUnits: 'pixels',  // 信号圈半径单位
        pointSize: 10,  // 信号中心点大小
        radiusSize:30,  // 信号圈扩散半径
        radiusMinPixels: 0,
        radiusMaxPixels:Number.MAX_SAFE_INTEGER,
        fadeTime: 20000,  // 信号消隐时长
        diffusionTimes:3,  // 扩散次数
        diffusionTime: 1000,  // 每次扩散时长
        widthUnits: 'pixels',  // 信号宽度大小单位
        widthScale: 3,  // 信号线宽度
        widthMinPixels: 0,
        widthMaxPixels: Number.MAX_SAFE_INTEGER,
        heightUnits: 'pixels',  // 信号高度大小单位
        heightScale: 350,  // 信号线高度
        heightMinPixels: 0,
        heightMaxPixels: Number.MAX_SAFE_INTEGER,
        currentTime:Date.now()
      });
    }

    const newLayers = [];
    for (const lyr of layers) {
      if (lyr.id !== 'signal') {
        newLayers.push(lyr);
      }
    }
    newLayers.push(this._singalLayer);
    this._deck.setProps({
      layers: newLayers
    });
  }

  addRingLayer() {

    const {layers} = this._deck.props;

    const layer=new SignalRingLayer({
        id:'ring',
        data:SIGNAL_DATA,
        getPosition: d=>d.Position,  // 信号源的空间位置
        getTriggerTime: d=> d.TriggerTime, // 信号源触发时间
        getOriginColor:  d=> d.OColor,  // 信号源渐变起始颜色
        getDestinationColor: d=>d.DColor, // 信号源渐结束颜色

        radiusUnits: 'pixels',  // 信号圈半径单位
        pointSize: 10,  // 信号中心点大小
        radiusSize:300,  // 信号圈扩散半径
        radiusMinPixels: 0,
        radiusMaxPixels:Number.MAX_SAFE_INTEGER,
        fadeTime: 5000,  // 信号消隐时长，默认为3000毫秒
        diffusionTimes:5,  // 扩散次数
        diffusionTime: 2000,  // 每次扩散时长，默认为1000毫秒
        currentTime:Date.now()-STARTTIME
      });
  
    

    const newLayers = [];
    for (const lyr of layers) {
      if (lyr.id !== 'ring') {
        newLayers.push(lyr);
      }
    }
    newLayers.push(layer);
    this._deck.setProps({
      layers: newLayers
    });

  }


  addRayLayer() {

    const {layers} = this._deck.props;

    const layer=new SignalRayLayer({
        id:'ray',
        data:SIGNAL_DATA,
        getPosition: d=>d.Position,  // 信号源的空间位置
        getTriggerTime: d=> d.TriggerTime, // 信号源触发时间
        getOriginColor:  d=> d.OColor,  // 信号源渐变起始颜色
        getDestinationColor: d=>d.DColor, // 信号源渐结束颜色

        widthUnits: 'pixels',  // 信号宽度大小单位
        widthScale: 3,  // 信号线宽度
        widthMinPixels: 0,
        widthMaxPixels: Number.MAX_SAFE_INTEGER,
        heightUnits: 'pixels',  // 信号高度大小单位
        heightScale: 1200,  // 信号线高度
        heightMinPixels: 0,
        heightMaxPixels: Number.MAX_SAFE_INTEGER,
        fadeTime: 5000,  // 信号消隐时长，默认为3000毫秒
        diffusionTimes:5,  // 扩散次数
        diffusionTime: 2000,  // 每次扩散时长，默认为1000毫秒
        currentTime:Date.now()-STARTTIME
      });
  
    

    const newLayers = [];
    for (const lyr of layers) {
      if (lyr.id !== 'ray') {
        newLayers.push(lyr);
      }
    }
    newLayers.push(layer);
    this._deck.setProps({
      layers: newLayers
    });

  }

  addColumnLayer() {

    const {layers} = this._deck.props;

    const layer=new ColumnLayer({
        id:'column',
        data:SIGNAL_DATA,
        getPosition: d=>d.Position,  // 信号源的空间位置
        getElevation: 100, // 信号源触发时间
        getFillColor:  d=> d.DColor,  // 信号源渐变起始颜色
        getLineColor: d=>d.DColor, // 信号源渐结束颜色
        getLineWidth:1,
        elevationScale:10,
        radius:5
      });
  

    const newLayers = [];
    for (const lyr of layers) {
      if (lyr.id !== 'column') {
        newLayers.push(lyr);
      }
    }
    newLayers.push(layer);
    this._deck.setProps({
      layers: newLayers
    });

  }


  pushTrackingPoints(trackingPoints)
  {
    if(this._trajectoryLayer)
    {
      this._trajectoryLayer.pushTracks(trackingPoints);
    }
  }

  pushSignal(signal) {
    const oColor= [10, 10, 255, 30];
    const dColor = [255, 0, 0, 200];
    if (this._singalLayer) {
      this._singalLayer.pushSignal(signal,oColor,dColor);
    }
  }


}


  // render() {

  //   if (!initialize) {
  //     return;
  //   }

  //   const DATA = {
  //     src: signalBuffer.buffer,
  //     length: signalBuffer._BufferSize
  //   };

  //   const layer = new ScatterplotLayer({
  //     id: 'scatterpoints',
  //     data: DATA,
  //     getPosition: (object, {
  //       index,
  //       data,
  //       target
  //     }) => {
  //       const dtv = new DataView(data.src);
  //       target[0] = dtv.getFloat32(index * 24, true);
  //       target[1] = dtv.getFloat32(index * 24 + 4, true);
  //       target[2] = dtv.getFloat32(index * 24 + 8, true);
  //       // console.log(target);
  //       // target[0]=data.scr[index*8];
  //       // target[0]=data.scr[index*8]+4;
  //       return target;
  //     },
  //     getLineColor: (object, {
  //       index,
  //       data,
  //       target
  //     }) => {
  //       const dtv = new DataView(data.src);
  //       target[0] = dtv.getUint8(index * 24 + 16);
  //       target[1] = dtv.getUint8(index * 24 + 17);
  //       target[2] = dtv.getUint8(index * 24 + 18);
  //       target[3] = dtv.getUint8(index * 24 + 19);
  //       return target;
  //     },
  //     getFillColor: (object, {
  //       index,
  //       data,
  //       target
  //     }) => {
  //       const dtv = new DataView(data.src);
  //       target[0] = dtv.getUint8(index * 24 + 20);
  //       target[1] = dtv.getUint8(index * 24 + 21);
  //       target[2] = dtv.getUint8(index * 24 + 22);
  //       target[3] = dtv.getUint8(index * 24 + 23);
  //       return target;

  //     },
  //     // updateTriggers: {
  //     //   getPosition: [TriggleTime],
  //     //   getRadius: [TriggleTime],
  //     // },
  //     pickable: true,
  //     autoHighlight: true,
  //     stroked: true,
  //     filled: true,
  //     getRadius: () => {
  //       return 10 + TriggleTime % 50
  //     },
  //     getLineWidth: 5
  //   });

  //   const {
  //     layers
  //   } = this._deck.props;
  //   const newLayers = [];
  //   for (const lyr of layers) {
  //     if (lyr.id !== 'scatterpoints') {
  //       newLayers.push(lyr);
  //     }
  //   }

  //   newLayers.push(layer);
  //   this._deck.setProps({
  //     layers: newLayers
  //   });

  // }

  // addScatterLayer() {
  //   if (initialize) {

  //     if (!this._ptLayer) {

  //       const DATA = {
  //         src: signalBuffer.buffer,
  //         length: signalBuffer._BufferSize
  //       };

  //       this._ptLayer = new ScatterplotLayer({
  //         id: 'scatterpoints',
  //         data: DATA,
  //         getPosition: (object, {
  //           index,
  //           data,
  //           target
  //         }) => {
  //           const dtv = new DataView(data.src);
  //           target[0] = dtv.getFloat32(index * 24, true);
  //           target[1] = dtv.getFloat32(index * 24 + 4, true);
  //           target[2] = dtv.getFloat32(index * 24 + 8, true);

  //           return target;
  //         },
  //         getLineColor: (object, {
  //           index,
  //           data,
  //           target
  //         }) => {
  //           const dtv = new DataView(data.src);
  //           target[0] = dtv.getUint8(index * 24 + 16);
  //           target[1] = dtv.getUint8(index * 24 + 17);
  //           target[2] = dtv.getUint8(index * 24 + 18);
  //           target[3] = dtv.getUint8(index * 24 + 19);

  //           return target;
  //         },
  //         getFillColor: (object, {
  //           index,
  //           data,
  //           target
  //         }) => {
  //           const dtv = new DataView(data.src);
  //           target[0] = dtv.getUint8(index * 24 + 20);
  //           target[1] = dtv.getUint8(index * 24 + 21);
  //           target[2] = dtv.getUint8(index * 24 + 22);
  //           target[3] = dtv.getUint8(index * 24 + 23);
  //           return target;

  //         },
  //         // updateTriggers: {
  //         //   getPosition: [TriggleTime],
  //         //   getRadius: [TriggleTime],
  //         // },
  //         pickable: true,
  //         autoHighlight: true,
  //         stroked: true,
  //         filled: true,
  //         getRadius: () => {
  //           return 10 + TriggleTime % 50
  //         },
  //         getLineWidth: 5
  //       });

  //       // console.log(this._ptLayer);
  //       // const newlayers=Object.assign({},layers,{scatterLayer}));
  //       // layers.push(scatterlayer);
  //       const {
  //         layers
  //       } = this._deck.props;
  //       layers.push(this._ptLayer);
  //       // const newLayers=[];
  //       // for(const lyr of layers)
  //       // {
  //       //   // eslint-disable-next-line max-depth
  //       //   if(lyr.id!=='scatterpoints')
  //       //   {
  //       //       newLayers.push(lyr);
  //       //   }
  //       // }

  //       // newLayers.push(this._ptLayer);
  //       // this._deck.setProps({layers: [newLayers]});

  //       // console.log(layers);

  //     } else {
  //       // this._ptLayer.forceUpdate();
  //       // const {layers} = this._deck.props;
  //       // for (const layer of layers) {
  //       //   if (layer.id === 'scatterpoints') {
  //       //     const {
  //       //       updateTriggers
  //       //     } = layer.props;
  //       //     // console.log(updateTriggers.getRadius);
  //       //     // console.log(TriggleTime);
  //       //   }
  //       // }

  //     }
  //   }
  // }

    // render2() {

  //   if (!initialize) {
  //     return;
  //   }

    
  //   const layer =new SignalRingLayer({
  //     id:'ring',
  //     data:SIGNAL_DATA,
  //     getPosition: { type: 'accessor', value: d =>d.Position},  // 信号源的空间位置
  //     getTriggerTime: { type: 'accessor', value: d=> d.TriggerTime}, // 信号源触发时间
  //     getOriginColor: { type: 'accessor', value: d=> d.OColor },  // 信号源渐变起始颜色
  //     getDestinationColor: { type: 'accessor', value: DEFAULT_DESTINATION_COLOR }, // 信号源渐结束颜色

  //     radiusUnits: 'pixels',  // 信号高度大小单位
  //     pointSize: { type: 'number', value: 5 },  // 信号中心点大小
  //     radiusSize: { type: 'number', value: 30 },  // 信号圈扩散半径
  //     radiusMinPixels: { type: 'number', value: 0, min: 0 },
  //     radiusMaxPixels: { type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0 },
  //     fadeTime: { type: 'number', value: 10000 },  // 信号消隐时长，默认为8000毫秒
  //     diffusionTimes: { type: 'number', value: 5 },  // 扩散次数
  //     diffusionTime: { type: 'number', value: 1000 },  // 每次扩散时长，默认为1000毫秒
  //     // currentTime:Date.now()
  //   });

  //   const {
  //     layers
  //   } = this._deck.props;
  //   const newLayers = [];
  //   for (const lyr of layers) {
  //     if (lyr.id !== 'ring') {
  //       newLayers.push(lyr);
  //     }
  //   }
    
  //   newLayers.push(layer);
  //   this._deck.setProps({
  //     layers: newLayers
  //   });

  // }

  // const signalBuffer = new SignalBuffer(1000, 10);
// let buffer;
// let positions = {};
// let TriggerTimes = {};
// let OColors = {};
// let DColors = {};
// let initialize = false;
// let TriggleTime = Date.now();

  // function onWebGLInitialized(gl) {
  // buffer = new Buffer(gl, signalBuffer.buffer);
  // positions = {
  //   buffer,
  //   type: GL.FLOAT,
  //   size: 3,
  //   offset: 0,
  //   stride: 24
  // };
  // TriggerTimes = {
  //   buffer,
  //   type: GL.FLOAT,
  //   size: 1,
  //   offset: 12,
  //   stride: 24
  // };
  // OColors = {
  //   buffer,
  //   type: GL.UNSIGNED_BYTE,
  //   size: 4,
  //   offset: 16,
  //   stride: 24
  // };
  // DColors = {
  //   buffer,
  //   type: GL.UNSIGNED_BYTE,
  //   size: 4,
  //   offset: 20,
  //   stride: 24
  // };
  // for(const x of SIGNAL_DATA)
  // {
  //   x.TriggerTime=Date.now()-STARTTIME;
  // }
  //initialize = true;
  //}

/* eslint-disable */
/* eslint-enable */