// language=glsl
export const terrainVertexShader = `
    precision mediump float;

    attribute float lodLevel;

    flat varying int vLodLevel;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    uniform float lodRanges[9];
    uniform float resolution;

    /** Noise **/
    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
        return mod289((x * 34.0 + 1.0) * x);
    }

    vec4 taylorInvSqrt(vec4 v) {
        return 1.79284291400159 - 0.85373472095314 * v;
    }

    vec3 fade(vec3 t) {
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    float perlinNoise(vec3 v) {
        vec3 i0 = mod289(floor(v));
        vec3 i1 = mod289(i0 + vec3(1.0));
        vec3 f0 = fract(v);
        vec3 f1 = f0 - vec3(1.0);
        vec3 f = fade(f0);
        vec4 ix = vec4(i0.x, i1.x, i0.x, i1.x);
        vec4 iy = vec4(i0.y, i0.y, i1.y, i1.y);
        vec4 iz0 = vec4(i0.z);
        vec4 iz1 = vec4(i1.z);
        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);
        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        gx1 = fract(gx1);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);
        vec3 g0 = vec3(gx0.x, gy0.x, gz0.x);
        vec3 g1 = vec3(gx0.y, gy0.y, gz0.y);
        vec3 g2 = vec3(gx0.z, gy0.z, gz0.z);
        vec3 g3 = vec3(gx0.w, gy0.w, gz0.w);
        vec3 g4 = vec3(gx1.x, gy1.x, gz1.x);
        vec3 g5 = vec3(gx1.y, gy1.y, gz1.y);
        vec3 g6 = vec3(gx1.z, gy1.z, gz1.z);
        vec3 g7 = vec3(gx1.w, gy1.w, gz1.w);
        vec4 norm0 = taylorInvSqrt(vec4(dot(g0, g0), dot(g2, g2), dot(g1, g1), dot(g3, g3)));
        vec4 norm1 = taylorInvSqrt(vec4(dot(g4, g4), dot(g6, g6), dot(g5, g5), dot(g7, g7)));
        g0 *= norm0.x;
        g2 *= norm0.y;
        g1 *= norm0.z;
        g3 *= norm0.w;
        g4 *= norm1.x;
        g6 *= norm1.y;
        g5 *= norm1.z;
        g7 *= norm1.w;
        vec4 nz = mix(
        vec4(
        dot(g0, vec3(f0.x, f0.y, f0.z)),
        dot(g1, vec3(f1.x, f0.y, f0.z)),
        dot(g2, vec3(f0.x, f1.y, f0.z)),
        dot(g3, vec3(f1.x, f1.y, f0.z))
        ),
        vec4(
        dot(g4, vec3(f0.x, f0.y, f1.z)),
        dot(g5, vec3(f1.x, f0.y, f1.z)),
        dot(g6, vec3(f0.x, f1.y, f1.z)),
        dot(g7, vec3(f1.x, f1.y, f1.z))
        ),
        f.z
        );
        return 2.2 * mix(mix(nz.x, nz.z, f.y), mix(nz.y, nz.w, f.y), f.x);
    }

    float fbm(vec3 pos) {
        float scale = 1000.0;
        float lacunarity = 4.0;
        float persistence = 0.3;
        float amplitude = 1.0;
        float frequency = 1.0;
        float noiseHeight = 0.0;
        for (int i = 0; i < 5; i++) {
            float sampleHeight = perlinNoise(pos / scale * frequency);
            noiseHeight += sampleHeight * amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return noiseHeight;
    }

    float easeInCubic(float x) {
        return x * x * x;
    }

    float height(vec3 pos) {
        return 200.0 * abs(easeInCubic(fbm(pos)));
    }

    // rough approximation
    vec3 calcNormal(vec3 pos) {
        float heightLeft = height(pos + vec3(-1.0, 0.0, 0.0));
        float heightRight = height(pos + vec3(1.0, 0.0, 0.0));
        float heightDown = height(pos + vec3(0.0, 0.0, -1.0));
        float heightUp = height(pos + vec3(1.0, 0.0, 1.0));
        return normalize(vec3(heightLeft - heightRight, 2.0, heightDown - heightUp));
    }

    /** Morphing **/
    float morphValue(float dist) {
        float low = 0.0;
        if (lodLevel != 0.0) {
            low = lodRanges[int(lodLevel) - 1];
        }
        float high = lodRanges[int(lodLevel)];
        float factor = (dist - low) / (high - low);
        return smoothstep(0.9, 1.0, factor);
    }

    /**
    * vertex: object space
    * mesh_pos: vertex normalized pos (0, 1)
    **/
    vec2 morphVertex(vec2 vertex, vec2 mesh_pos, float morphValue) {
        vec2 gridDim = vec2(resolution, resolution);
        vec2 fraction = fract(mesh_pos * gridDim * 0.5) * 2.0 / gridDim;
        return vertex - fraction * morphValue;
    }

    void main() {
        // visualization: pass lod level for color tinting
        vLodLevel = int(floor(lodLevel));

        // position after moving and scaling tile
        vec3 worldPos = (instanceMatrix * vec4(position, 1.0)).xyz;

        float dist = length(cameraPosition - worldPos);
        float morphK = morphValue(dist);
        // morph in object space
        vec2 morphedPos = morphVertex(position.xz, uv.xy, morphK);

        vec3 morphedWorldPos = (instanceMatrix * vec4(morphedPos.x, 0.0, morphedPos.y, 1.0)).xyz;
        float noiseHeight = height(morphedWorldPos);
        vec3 finalPosition = vec3(morphedWorldPos.x, noiseHeight, morphedWorldPos.z);
        vWorldPos = finalPosition;

        vec3 n = calcNormal(morphedWorldPos);
        vNormal = n;

        gl_Position = projectionMatrix * viewMatrix * vec4(finalPosition, 1.0);
    }
`;
