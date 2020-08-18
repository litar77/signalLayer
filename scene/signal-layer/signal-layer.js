import {CompositeLayer, project32, picking} from '@deck.gl/core';
import GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';


import SignalBuffer from './signal-buffer'
import SignalRayLayer from './signal-ray-layer'
import SignalRingLayer from './signal-ring-layer'

const DEFAULT_ORIGIN_COLOR = [100, 100, 255, 80];
const DEFAULT_DESTINATION_COLOR = [200, 200, 255, 100];


const defaultProps = {
  getPosition: {type: 'accessor', value: x => x.Position},  // 信号源的空间位置
  getTriggerTime: {type: 'accessor', value: ()=>Date.now()}, // 信号源触发时间
  getOriginColor: {type: 'accessor', value: DEFAULT_ORIGIN_COLOR},  // 信号源渐变起始颜色
  getDestinationColor: {type: 'accessor', value: DEFAULT_DESTINATION_COLOR}, // 信号源渐结束颜色

  rayVisble:false,  // 显示信号发射线
  ringVisible:true,  // 显示信号扩散圈
  widthUnits: 'pixels',  // 信号宽度大小单位
  widthScale: {type: 'number', value: 1, min: 0},  // 信号线宽度
  widthMinPixels: {type: 'number', value: 0, min: 0},
  widthMaxPixels: {type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0},
  heightUnits: 'pixels',  // 信号高度大小单位
  heightScale: {type: 'number', value: 20},  // 信号线高度
  heightMinPixels: {type: 'number', value: 0, min: 0},
  heightMaxPixels: {type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0},
  radiusUnits: 'pixels',  // 信号高度大小单位
  pointSize: {type: 'number', value: 5},  // 信号中心点大小
  radiusSize: {type: 'number', value: 30},  // 信号圈扩散半径
  radiusMinPixels: {type: 'number', value: 0, min: 0},
  radiusMaxPixels: {type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0},
  fadeTime: {type: 'number', value: 3000},  // 信号消隐时长，默认为3000毫秒
  diffusionTimes: {type: 'number', value: 3},  // 扩散次数
  diffusionTime: {type: 'number', value: 1000},  // 每次扩散时长，默认为1000毫秒
};


const BufferSize=1000;  // 信号缓存数据量上限，后续可以允许二次开发修改该值，为了确保性能可以采用chunk:
const DefaultLifespan=6000; // 默认信号生命周期为6秒
const TIME_REFRENCE_POINT=Date.now();

export default class SignalLayer extends CompositeLayer {
 

  initializeState() {

    const {diffusionTimes,diffusionTime,fadeTime}=this.props;
    let Lifespan=DefaultLifespan;
    if(diffusionTimes && diffusionTime && fadeTime)
    {
      Lifespan=diffusionTimes*diffusionTime+fadeTime;
    }

    this.setState({
      numInstances: BufferSize,
      signalBuffer:new SignalBuffer(BufferSize,Lifespan),
      signalbufferCursor:0,
      raf: null,
    });

  }

  shouldUpdateState({changeFlags}) {
    if (changeFlags.propsChanged || changeFlags.dataChanged || changeFlags.stateChanged) {
      return true;
    }

    return false;
  }
    
  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});
    const {propsChanged, stateChanged, dataChanged} = changeFlags;
    if (!propsChanged && !dataChanged && stateChanged) return false;

    /**
     * Animaiton trigger judgement
     */
    const {raf} = this.state;
    // eslint-disable-next-line no-unused-expressions
    raf && cancelAnimationFrame(raf);

    this.startAnimation();
    
    return true;
  }

  startAnimation() {
    // console.log(this.props)
    const raf = window.requestAnimationFrame(this.startAnimation.bind(this));
    this.setState({raf});
    
  }

  renderLayers() {

    const {gl,viewport} = this.context;
    const {rayVisible,ringVisible,fadeTime,diffusionTimes,diffusionTime} = this.props;


    const {signalBuffer} = this.state;
    if (!signalBuffer) return [];

    
    const bufferData=new Float32Array(signalBuffer.buffer);
    const buffer = new Buffer(gl,bufferData);

    // 确保和SignalBuffer中定义的缓存步长一致
    const bytesPerDatum=signalBuffer.bytesPerDatum;

    const positions = {buffer, type: GL.FLOAT, size: 3, offset: 0, stride: bytesPerDatum};
    const TriggerTimes = {buffer, type: GL.FLOAT, size: 1, offset: 12, stride: bytesPerDatum};
    const OColors = {buffer, type: GL.UNSIGNED_BYTE, size: 4, offset: 16, stride: bytesPerDatum};
    const DColors = {buffer, type: GL.UNSIGNED_BYTE, size: 4, offset: 20, stride: bytesPerDatum};

    const databuffer=
    {
      length: signalBuffer.buffersize,
      attributes: {
        getPosition: positions,
        getTriggerTime: TriggerTimes,
        getOriginColor:OColors,
        getDestinationColor:DColors
      }
    };
    
    const RayLayerClass = this.getSubLayerClass('ray', SignalRayLayer);
    const RingLayerClass = this.getSubLayerClass('ring', SignalRingLayer);

    const {pointSize,radiusSize, radiusUnits,radiusMinPixels,radiusMaxPixels} = this.props;
    const radiusMultiplier = radiusUnits === 'pixels' ? viewport.metersPerPixel : 1;

    /* eslint-disable complexity */
    const ringLayer =
    this.shouldRenderSubLayer('ring', databuffer) &&
    new RingLayerClass(
      {
        id: `${this.props.id}-ring`,
        data:databuffer,
        radiusScale: radiusSize * radiusMultiplier,
        radiusMinPixels,
        radiusMaxPixels,
        pointSize,
        fadeTime,
        diffusionTimes,
        diffusionTime,
        currentTime:Date.now()-TIME_REFRENCE_POINT
      }
    );

 
    const {widthUnits, widthScale, widthMinPixels, widthMaxPixels,
            heightUnits, heightScale, heightMinPixels, heightMaxPixels} = this.props;
    const widthMultiplier = widthUnits === 'pixels' ? viewport.metersPerPixel : 1;
    const heightMultiplier = heightUnits === 'pixels' ? viewport.metersPerPixel : 1;
    
     
    const rayLayer =
    this.shouldRenderSubLayer('ray', databuffer) &&
    new RayLayerClass(
      {
        id: `${this.props.id}-ray`,
        data:databuffer,
        widthScale: widthScale * widthMultiplier,
        widthMinPixels,
        widthMaxPixels,
        heightScale: heightScale * heightMultiplier,
        heightMinPixels,
        heightMaxPixels,
        fadeTime,
        diffusionTimes,
        diffusionTime,
        currentTime:Date.now()-TIME_REFRENCE_POINT
      }
    );

    // eslint-disable-next-line consistent-return
    return [
      ringVisible && ringLayer,
      rayVisible && rayLayer
    ];
    /* eslint-enable complexity */  
    
  }

    

  finalizeState() {
    super.finalizeState();

    const {signalBuffer} = this.state;
    if (signalBuffer) {
        signalBuffer.finalize();
    }
  }

  // 接收信号放入缓冲区，便于在前端动态显示
  pushSignal(signal,oColor,dColor)
  {
    if(!this.state)
    {
      return;
    }


    const {signalBuffer} = this.state;
    if(signalBuffer)
    {
      const sigporps=Object.assign({},
      {triggerTime:Date.now()-TIME_REFRENCE_POINT,
        OColor:oColor===undefined?DEFAULT_ORIGIN_COLOR:oColor,
        DColor:dColor===undefined?DEFAULT_DESTINATION_COLOR:dColor,
      },{position:signal});

      const signalbufferCursor=signalBuffer.push(sigporps);
      this.setState({signalbufferCursor});
     
    }
  }

}

SignalLayer.layerName = 'SignalLayer';
SignalLayer.defaultProps = defaultProps;
