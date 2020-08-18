export default `\
#define SHADER_NAME signal-ray-layer-vertex-shader

attribute vec3 positions;

attribute vec3 instancePositions;
attribute vec3 instancePositions64Low;
attribute float instanceTriggerTime;
attribute vec4 instanceOriginColor;
attribute vec4 instanceDestinationColor;

attribute vec3 instancePickingColors;

// Custom uniforms
uniform float opacity;
uniform float widthScale;
uniform float widthMinPixels;
uniform float widthMaxPixels;
uniform float heightScale;
uniform float heightMinPixels;
uniform float heightMaxPixels;
uniform float fadeTime;
uniform float diffusionTimes;
uniform float diffusionTime;
uniform float currentTime;
uniform float angle;

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
    return mod(growthTime,diffusionTime)/diffusionTime;
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

  // When the time exceeds fadetime, it means fade out completely,FadingRatio<0.0
  return (fadeTime-growthTime+diffusionSumTime)/fadeTime;
  
}


void main(void) {

  geometry.worldPosition = instancePositions;

  unitPosition =vec2(positions.x, (positions.z + 1.0) / 2.0);
  geometry.uv = unitPosition;
  
  float growthTime=currentTime-instanceTriggerTime;
  timePhase=calcTimePhase(growthTime);

  mat2 rotationMatrix = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));

 
  float heightPixels = clamp(project_size_to_pixel(heightScale),heightMinPixels, heightMaxPixels);
  // cylindar gemoetry height are between -1.0 to 1.0, transform it to between 0, 1
  float elevation =  (positions.z + 1.0) / 2.0 * heightPixels*abs(timePhase);
  float widthPixels = clamp(project_size_to_pixel(widthScale),widthMinPixels, widthMaxPixels) / 2.0;
  geometry.pickingColor = instancePickingColors;

  // project center of column
  vec3 centroidPosition = vec3(instancePositions.xy, instancePositions.z + elevation);
  vec3 centroidPosition64Low = instancePositions64Low;
  vec3 offset = vec3(project_size(rotationMatrix * positions.xy*widthPixels), 0.0);
  DECKGL_FILTER_SIZE(offset, geometry);

  gl_Position = project_position_to_clipspace(centroidPosition, centroidPosition64Low, offset, geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  if(timePhase<0.0)
  {
    //The diffusion is over, it’s the turn to fade the sign
    fadeRatio=calcFadingRatio(growthTime,diffusionTime*diffusionTimes);
  }else
  {
    fadeRatio=1.0;
  }

  if(fadeRatio>=0.0)
  { 
    vOColor =vec4(instanceOriginColor.rgb, instanceOriginColor.a *opacity*fadeRatio);
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
