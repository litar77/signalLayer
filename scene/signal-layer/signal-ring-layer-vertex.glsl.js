export default `\
#define SHADER_NAME signal-ring-layer-vertex-shader

attribute vec3 positions;
attribute vec3 instancePositions;
attribute vec3 instancePositions64Low;
attribute float instanceTriggerTime;
attribute vec4 instanceOriginColor;
attribute vec4 instanceDestinationColor;
attribute vec3 instancePickingColors;

uniform float opacity;
uniform float pointSize;
uniform float radiusSize;
uniform float radiusMinPixels;
uniform float radiusMaxPixels;
uniform float fadeTime;
uniform float diffusionTimes;
uniform float diffusionTime;
uniform float currentTime;

varying vec2 unitPosition;
varying vec4 vOColor;
varying vec4 vDColor;
varying float fadeRatio;
varying float timePhase;

float calcTimePhase(float growthTime)
{

  float actdftimes=floor(growthTime/diffusionTime);

  if(actdftimes<=diffusionTimes)
  {
    return mod(growthTime,diffusionTime)/diffusionTime+actdftimes;
  }else
  {
    return -1.0;  // Has reached the predetermined number of diffusions
  }
  
}

float calcFadingRatio(float growthTime,float diffusionSumTime)
{

  if(growthTime<diffusionSumTime)
  {
    return 1.0;
  }

  // When the time exceeds fadetime, it means fade out completely，FadingRatio<0.0
  return (fadeTime-growthTime+diffusionSumTime)/fadeTime;
  
}


void main(void) {
  
  float growthTime=currentTime-instanceTriggerTime;
  timePhase=calcTimePhase(growthTime);
  float RadiusPixels=0.0;
  if(timePhase<0.0)
  {
    //The diffusion is over, it’s the turn to fade the sign
    fadeRatio=calcFadingRatio(growthTime,diffusionTime*diffusionTimes);
    RadiusPixels = clamp(
      project_size_to_pixel(pointSize),
      radiusMinPixels, radiusMaxPixels
    );

  }else
  {

    fadeRatio=1.0;
    RadiusPixels = clamp(
      project_size_to_pixel(radiusSize),
      radiusMinPixels, radiusMaxPixels
    );
  }

  geometry.worldPosition = instancePositions;
  // position on the containing square in [-1, 1] space
  unitPosition = positions.xy;
  geometry.uv = unitPosition;
  geometry.pickingColor = instancePickingColors;


  vec3 offset = positions * project_pixel_size(RadiusPixels);
  DECKGL_FILTER_SIZE(offset, geometry);
  gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

 
  if(fadeRatio>=0.0)
  { 
    vOColor = vec4(instanceOriginColor.rgb, instanceOriginColor.a *opacity*fadeRatio);
    DECKGL_FILTER_COLOR(vOColor, geometry);
    vDColor = vec4(instanceDestinationColor.rgb, instanceDestinationColor.a * opacity*fadeRatio);
    DECKGL_FILTER_COLOR(vDColor, geometry);
  }else
  {
    vOColor = vec4(instanceOriginColor.rgb, instanceOriginColor.a *opacity);
    DECKGL_FILTER_COLOR(vOColor, geometry);
    vDColor = vec4(instanceDestinationColor.rgb, instanceDestinationColor.a * opacity);
    DECKGL_FILTER_COLOR(vDColor, geometry);
  }

}
`;