import {Layer, project32, picking} from '@deck.gl/core';
import GL from '@luma.gl/constants';
import {Model} from '@luma.gl/core';
// import {CylinderGeometry} from '@luma.gl/engine';
import ColumnGeometry from './column-geometry';


import vsray from './signal-ray-layer-vertex.glsl';
import fsray from './signal-ray-layer-fragment.glsl';


const DEFAULT_ORIGIN_COLOR = [100, 30, 30, 10];
const DEFAULT_DESTINATION_COLOR = [255, 0, 0, 255];


const defaultProps = {
  diskResolution: {type: 'number', min: 4, value: 20},
  vertices: null,
  getPosition: {type: 'accessor', value: x => x.Position},  // 信号源的空间位置
  getTriggerTime: {type: 'accessor', value: ()=>Date.now()}, // 信号源触发时间
  getOriginColor: {type: 'accessor', value: DEFAULT_ORIGIN_COLOR},  // 信号源渐变起始颜色
  getDestinationColor: {type: 'accessor', value: DEFAULT_DESTINATION_COLOR}, // 信号源渐结束颜色

  widthUnits: 'pixels',  // 信号宽度大小单位
  widthScale: {type: 'number', value: 1, min: 0},  // 信号线宽度
  widthMinPixels: {type: 'number', value: 0, min: 0},
  widthMaxPixels: {type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0},
  heightUnits: 'pixels',  // 信号高度大小单位
  heightScale: {type: 'number', value: 50},  // 信号线高度
  heightMinPixels: {type: 'number', value: 0, min: 0},
  heightMaxPixels: {type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0},
  fadeTime: {type: 'number', value: 3000},  // 信号消隐时长，默认为3000毫秒
  diffusionTimes: {type: 'number', value: 3},  // 扩散次数
  diffusionTime: {type: 'number', value: 1000},  // 每次扩散时长，默认为1000毫秒
  angle:{ type: 'number', value: 0}  // 发射角度
};

export default class SignalRayLayer extends Layer {
  getShaders(vs,fs) {
    return super.getShaders({vs, fs,modules: [project32,picking]}); // 'project' module added by default.
  }

  initializeState() {

    const {gl} = this.context;
    this.setState({
        model: this._getModel(gl)
    });

    const attributeManager = this.getAttributeManager();

    /* eslint-disable max-len */
    attributeManager.addInstanced({
      instancePositions: {
        size: 3,
        type: GL.DOUBLE,
        fp64: this.use64bitPositions(),
        transition: true,
        accessor: 'getPosition'
      },
      instanceTriggerTime: {
        size: 1,
        transition: true,
        type: GL.FLOAT,
        accessor: 'getTriggerTime',
        update: this.calcTriggerTime
      },          
      instanceOriginColor: {
        size: 4,
        transition: true,
        normalized: true,
        type: GL.UNSIGNED_BYTE,
        accessor: 'getOriginColor', 
        defaultValue: DEFAULT_ORIGIN_COLOR
      } ,
      instanceDestinationColor: {
        size: 4,
        transition: true,
        normalized: true,
        type: GL.UNSIGNED_BYTE,
        accessor: 'getDestinationColor', 
        defaultValue: DEFAULT_DESTINATION_COLOR
      }
    });

    /* eslint-enable max-len */
  }
    
  updateState({ props, oldProps, changeFlags }) {
   
    super.updateState({ props, oldProps, changeFlags });
 
    const regenerateModels = changeFlags.extensionsChanged;

    if (regenerateModels) {
      const {gl} = this.context;
      if (this.state.model) {
        this.state.model.delete();
      }
      this.setState({model: this._getModel(gl)});
      this.getAttributeManager().invalidateAll();
    }

    if (regenerateModels ||
      props.diskResolution !== oldProps.diskResolution ||
      props.vertices !== oldProps.vertices) 
    {
      this._updateGeometry(props);
    }
  }

  getGeometry(diskResolution, vertices) {
    const geometry = new ColumnGeometry({
      radius: 1,
      height: 2,
      vertices,
      nradial: diskResolution
    });

    let meanVertexDistance = 0;
    if (vertices) {
      for (let i = 0; i < diskResolution; i++) {
        const p = vertices[i];
        const d = Math.sqrt(p[0] * p[0] + p[1] * p[1]);
        meanVertexDistance += d / diskResolution;
      }
    } else {
      meanVertexDistance = 1;
    }
    this.setState({
      edgeDistance: Math.cos(Math.PI / diskResolution) * meanVertexDistance
    });

    return geometry;
  }

  _getModel(gl) {
    return new Model(
      gl,
      Object.assign({}, this.getShaders(vsray,fsray), {
        id: this.props.id,
        isInstanced: true
      })
    );
  }

  _updateGeometry({diskResolution, vertices}) {
    const geometry = this.getGeometry(diskResolution, vertices);

    this.setState({
      fillVertexCount: geometry.attributes.POSITION.value.length / 3,
      wireframeVertexCount: geometry.indices.value.length
    });

    this.state.model.setProps({geometry});
  }

  draw({uniforms}) 
  {
    const {viewport} = this.context;
    const {fadeTime,diffusionTimes,diffusionTime,currentTime,
          widthUnits, widthScale, widthMinPixels, widthMaxPixels,
          heightUnits, heightScale, heightMinPixels, heightMaxPixels,angle} = this.props;

    const widthMultiplier = widthUnits === 'pixels' ? viewport.metersPerPixel : 1;
    const heightMultiplier = heightUnits === 'pixels' ? viewport.metersPerPixel : 1;
    
    const rayUinform=Object.assign({}, uniforms, {
      widthScale: widthScale * widthMultiplier,
      widthMinPixels,
      widthMaxPixels,
      heightScale: heightScale * heightMultiplier,
      heightMinPixels,
      heightMaxPixels,
      fadeTime,
      diffusionTimes,
      diffusionTime,
      currentTime,
      angle:(angle / 180) * Math.PI, 
      isStroke: false,
      parameters: {
        // prevent flicker from z-fighting
        [GL.DEPTH_TEST]: true,
  
        // turn on additive blending to make them look more glowy
        [GL.BLEND]: true,
        [GL.BLEND_SRC_RGB]: GL.ONE,
        [GL.BLEND_DST_RGB]: GL.ONE,
        [GL.BLEND_EQUATION]: GL.FUNC_ADD,
      }
    });

    const {model, fillVertexCount} = this.state;

    model.setUniforms(rayUinform);
    model.setProps({isIndexed: false});
    model
    .setVertexCount(fillVertexCount)
    .setDrawMode(GL.TRIANGLE_STRIP)
    .draw();

  }

}

SignalRayLayer.layerName = 'SignalRayLayer';
SignalRayLayer.defaultProps = defaultProps;
