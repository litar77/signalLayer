
import {CompositeLayer} from '@deck.gl/core';
import GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';


import {TIME_REFRENCE_POINT} from './trajectory-buffer'
import TrajectoryBuffer from './trajectory-buffer'
import LineLayer from './line-layer'
const DEFAULT_POINT_COLOR = [200, 200, 255, 200];
const DEFAULT_TAIL_COLOR = [100, 100, 255, 180];

// uniform float opacity;
// uniform float widthScale;
// uniform float widthMinPixels;
// uniform float widthMaxPixels;
// uniform float currentTime;
// uniform float delayTime;
// uniform float trackingTime;

const defaultProps = {
    style: {type: 'number', value: 1, min: 0},  // 轨迹线风格--1：宽线，2：细线
    RealTime:{type: 'number', value: 1, min: 0},    // 1：实时轨迹；2：回放轨迹
    widthUnits: 'pixels',  // 轨迹线宽度大小单位
    widthScale: {type: 'number', value: 1, min: 0},  // 轨迹线线宽度
    widthMinPixels: {type: 'number', value: 0, min: 0},
    widthMaxPixels: {type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0},
    pointUnits: 'pixels',  // 目标对象大小单位
    pointSize: {type: 'number', value: 5},  // 目标对象大小
    pointMinPixels: {type: 'number', value: 0, min: 0},
    pointMaxPixels: {type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0},
    currentTime: {type: 'number', value: 0, min: 0},   // 轨迹显示当前时间
    maxTrackCounts:{type: 'number', value: 200},    // 最多同时显示轨迹数量，仅用于计算缓冲区大小
    maxTrackPoints:{type: 'number', value: 50},    // 一条轨迹可显示的点最大数量，仅用于计算缓冲区大小
    trackingTime: {type: 'number', value: 10000},  // 轨迹跟踪时间
    delayTime: {type: 'number', value: 500},  // 轨迹延迟时间
    opacity: {type: 'number', value: 1.0},  // 透明度
    getTrackPointColor: {type: 'accessor', value: DEFAULT_POINT_COLOR}, // 目标点颜色 
    getTrackLineColor: {type: 'accessor', value: DEFAULT_TAIL_COLOR}, // 尾迹颜色
  };




export default class TrajectoryLayer extends CompositeLayer {
 

  initializeState() {

    const {maxTrackCounts,maxTrackPoints,trackingTime}=this.props;

    // 针对实时数据集，一定要注意初始化缓存区大小，要根据轨迹数量、更新频度、轨迹消隐时长来计算缓冲区大小
    // 以避免轨迹显示不全. 一旦缓冲池塞满了，就要从头开始写入轨迹点。
    // 由于缓冲池是按照时间排序的循环队列，如果缓冲池足够大，足以容纳规定的轨迹显示（生命）周期内所有被激活
    // 的轨迹,就不用开辟新的缓存增大缓冲池容量；如果缓冲池太小就会出现部分轨迹尾部显示不全的情况
    
    this.setState({
      trajectoryBuffer:new TrajectoryBuffer(maxTrackCounts*maxTrackPoints,trackingTime),
      trajectoryBufferCursor:0,
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

    const raf = window.requestAnimationFrame(this.startAnimation.bind(this));
    this.setState({raf});
    
  }

  renderLayers() {

    const {gl} = this.context;

    const {trajectoryBuffer} = this.state;
    if (!trajectoryBuffer) return [];

    
    const bufferData=new Float32Array(trajectoryBuffer.buffer);
       
    const buffer = new Buffer(gl,bufferData);

    // 确保和trajectoryBuffer中定义的缓存步长一致
    const bytesPerDatum=trajectoryBuffer.bytesPerDatum;

    const orgPoints = {buffer, type: GL.FLOAT, size: 3, offset: 0, stride: bytesPerDatum};
    const orgTimes={buffer, type: GL.FLOAT, size: 1, offset: 12, stride: bytesPerDatum};
    const destPoints = {buffer, type: GL.FLOAT, size: 3, offset: 16, stride: bytesPerDatum};
    const destTimes={buffer, type: GL.FLOAT, size: 1, offset: 28, stride: bytesPerDatum};

    const databuffer=
    {
      length: trajectoryBuffer.buffersize,
      attributes: {
        getSourcePosition: orgPoints,
        getSourceTime:orgTimes,
        getTargetPosition: destPoints,
        getTargetTime: destTimes
      }
    };
    
    const LineLayerClass = this.getSubLayerClass('Line', LineLayer);

    const {
      widthScale, 
      widthUnits,
      widthMinPixels,
      widthMaxPixels,
      trackingTime,
      delayTime,
      opacity
    } = this.props;

    const {
      getTrackLineColor, 
    } = this.props;
  
    
    /* eslint-disable complexity */
    const lineLayer =
    this.shouldRenderSubLayer('Line', databuffer) &&
    new LineLayerClass(
      {
        id: `${this.props.id}-Line`,
        data:databuffer,
        widthScale,
        widthUnits,
        widthMinPixels,
        widthMaxPixels,
        trackingTime,
        delayTime,
        currentTime:Date.now()-TIME_REFRENCE_POINT,
        opacity,
        getColor: this.getSubLayerAccessor(getTrackLineColor),
        getWidth:5
      }
    );


    // eslint-disable-next-line consistent-return
    return [lineLayer];
    /* eslint-enable complexity */  
    
  }

  finalizeState() {
    super.finalizeState();

    const {trajectoryBuffer} = this.state;
    if (trajectoryBuffer) {
        trajectoryBuffer.finalize();
    }
  }

  // 接收轨迹并推送到缓冲区中
  // tracks=trackinfo[];
  // trackinfo={trackid,point4d};
  // point4d=float[4];
  pushTracks(tracks)
  {

    if(!this.state)
    {
      return;
    }


    const {trajectoryBuffer} = this.state;

    if(trajectoryBuffer)
    {
      const trajectoryBufferCursor=trajectoryBuffer.push(tracks);
      this.setState({trajectoryBufferCursor});
     
    }
  }

}

TrajectoryLayer.layerName = 'TrajectoryLayer';
TrajectoryLayer.defaultProps = defaultProps;
