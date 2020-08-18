
export default `\
#define SHADER_NAME signal-ray-layer-fragment-shader
#define PI 3.14159265359

precision highp float;

varying vec2 unitPosition;
varying vec4 vOColor;
varying vec4 vDColor;
varying float fadeRatio;
varying float timePhase;

void main(void) {
  
  if (fadeRatio <= 0.0) discard;
  geometry.uv = unitPosition;
    
  gl_FragColor = mix(vOColor, vDColor, unitPosition.y);
  
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);

}
`;
