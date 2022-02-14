// language=glsl
export const terrainFragmentShader = `
precision mediump float;

flat varying int vLodLevel;
varying vec3 vNormal;
varying vec3 vWorldPos;

uniform vec3 sun;
uniform vec3 colors[9];
uniform sampler2D grass;

vec4 triplanarDiffuse(vec3 pos, vec3 normal, sampler2D tex) {
    vec2 uvX = pos.zy;
    vec2 uvY = pos.xz;
    vec2 uvZ = pos.xy;

    vec4 tX = texture2D(tex, uvX);
    vec4 tY = texture2D(tex, uvY);
    vec4 tZ = texture2D(tex, uvZ);

    vec3 weights = abs(normal);
    weights /= (weights.x + weights.y + weights.z);

    return tX * weights.x + tY * weights.y + tZ * weights.z;
}

void main() {
    vec3 color = colors[vLodLevel];
    vec3 light = normalize(sun);
    float brightness = max(dot(vNormal, light), 0.4);
    vec4 grassColor = triplanarDiffuse(vWorldPos, vNormal, grass);
    vec3 diffuse = brightness * normalize(grassColor.xyz);
    gl_FragColor = vec4(diffuse + color * 0.05, 1.0); // tint grass color with lod color
}
`
