
export default `\
#define SHADER_NAME signal-ring-layer-fragment-shader

#define PI 3.14159265359
precision highp float;

varying vec2 unitPosition;
varying vec4 vOColor;
varying vec4 vDColor;
varying float fadeRatio;
varying float timePhase;

void main(void) {

  if(fadeRatio<=0.0)
  {
    discard;
  }

  geometry.uv = unitPosition;

  float distToCenter = length(unitPosition);

  if (distToCenter > 1.0) {
    discard;
  }

  if(timePhase>=0.0)
  {
    if(distToCenter>timePhase)
    {
      discard;
    }

    float x=fract(distToCenter-timePhase);
    gl_FragColor = mix(vOColor, vDColor, sin(x*PI*0.5));

  }else
  {
    gl_FragColor =vDColor;
  }
  
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
