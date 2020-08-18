import { Layer, project32, picking } from '@deck.gl/core';
import GL from '@luma.gl/constants';
import { Model, Geometry} from '@luma.gl/core';

import vsring from './signal-ring-layer-vertex.glsl';
import fsring from './signal-ring-layer-fragment.glsl';

const DEFAULT_ORIGIN_COLOR = [100, 30, 30, 10];
const DEFAULT_DESTINATION_COLOR = [255, 0, 0, 255];


const defaultProps = {
    getPosition: { type: 'accessor', value: x => x.Position },  // 信号源的空间位置
    getTriggerTime: { type: 'accessor', value: x=> x.TriggerTime}, // 信号源触发时间
    getOriginColor: { type: 'accessor', value: x=> x.OColor },  // 信号源渐变起始颜色
    getDestinationColor: { type: 'accessor', value: x=>x.DColor }, // 信号源渐结束颜色

    radiusUnits: 'pixels',  // 信号高度大小单位
    pointSize: { type: 'number', value: 5 },  // 信号中心点大小
    radiusSize: { type: 'number', value: 30 },  // 信号圈扩散半径
    radiusMinPixels: { type: 'number', value: 0, min: 0 },
    radiusMaxPixels: { type: 'number', value: Number.MAX_SAFE_INTEGER, min: 0 },
    fadeTime: { type: 'number', value: 3000 },  // 信号消隐时长，默认为3000毫秒
    diffusionTimes: { type: 'number', value: 100 },  // 扩散次数
    diffusionTime: { type: 'number', value: 2000 },  // 每次扩散时长，默认为1000毫秒
};


export default class SignalRingLayer extends Layer {
    getShaders(vs, fs) {
        return super.getShaders({ vs, fs, modules: [project32, picking] }); // 'project' module added by default.
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
            },
            instanceOriginColor: {
                size: 4,
                transition: true,
                normalized: true,
                type: GL.UNSIGNED_BYTE,
                accessor: 'getOriginColor',
                defaultValue: DEFAULT_ORIGIN_COLOR
            },
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

        if (changeFlags.extensionsChanged) {
            const { gl } = this.context;
            if (this.state.model) {
                this.state.model.delete();
            }
            this.setState({ model: this._getModel(gl) });
            this.getAttributeManager().invalidateAll();
        }

    }

    draw({ uniforms }) {
        const { viewport } = this.context;
        const { fadeTime, diffusionTimes, diffusionTime } = this.props;


        // 绘制信号扩散圈
        const { pointSize, radiusSize, radiusUnits, radiusMinPixels, radiusMaxPixels,currentTime} = this.props;
        const radiusMultiplier = radiusUnits === 'pixels' ? viewport.metersPerPixel : 1;
        
        const ringUniforms = Object.assign({}, uniforms, {
            pointSize: pointSize * radiusMultiplier,
            radiusSize: radiusSize * radiusMultiplier,
            radiusMinPixels,
            radiusMaxPixels,
            fadeTime,
            diffusionTimes,
            diffusionTime,
            currentTime,
            parameters: {
                // prevent flicker from z-fighting
                [GL.DEPTH_TEST]: false,
          
                // turn on additive blending to make them look more glowy
                [GL.BLEND]: true,
                [GL.BLEND_SRC_RGB]: GL.ONE,
                [GL.BLEND_DST_RGB]: GL.ONE,
                [GL.BLEND_EQUATION]: GL.FUNC_ADD,
            },
        });

        this.state.model
            .setUniforms(ringUniforms)
            .draw();

    }

    _getModel(gl) {
        // a square that minimally cover the unit circle
        const positions = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0];

        return new Model(
            gl,
            Object.assign({}, this.getShaders(vsring,fsring),
            {
                id: this.props.id,
                geometry: new Geometry({
                    drawMode: GL.TRIANGLE_FAN,
                    vertexCount: 4,
                    attributes: {
                        positions: { size: 3, value: new Float32Array(positions) }
                    }
                }),
                isInstanced: true
            })
        );
    }


}

SignalRingLayer.layerName = 'SignalRingLayer';
SignalRingLayer.defaultProps = defaultProps;
