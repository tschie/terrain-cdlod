var E=Object.defineProperty;var W=Object.getOwnPropertySymbols;var T=Object.prototype.hasOwnProperty,k=Object.prototype.propertyIsEnumerable;var w=(o,e,t)=>e in o?E(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t,b=(o,e)=>{for(var t in e||(e={}))T.call(e,t)&&w(o,t,e[t]);if(W)for(var t of W(e))k.call(e,t)&&w(o,t,e[t]);return o};var l=(o,e,t)=>(w(o,typeof e!="symbol"?e+"":e,t),t);import{S as D,B as g,V as s,W as O,C as X,a as B,b as G,M as I,P as Q,F as Y,c as Z,d as K,I as _,e as $,R as N,f as J,g as ee,h as te,G as oe,i as re,j as F,Q as se}from"./vendor.405ae512.js";const ae=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const y of i.addedNodes)y.tagName==="LINK"&&y.rel==="modulepreload"&&a(y)}).observe(document,{childList:!0,subtree:!0});function t(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerpolicy&&(i.referrerPolicy=r.referrerpolicy),r.crossorigin==="use-credentials"?i.credentials="include":r.crossorigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(r){if(r.ep)return;r.ep=!0;const i=t(r);fetch(r.href,i)}};ae();class v{constructor(e){l(this,"aabb");l(this,"lodLevel");this.aabb=e}get children(){return[new v(new g(new s(this.aabb.min.x,this.aabb.min.y,this.aabb.getCenter(new s).z),new s(this.aabb.getCenter(new s).x,this.aabb.max.y,this.aabb.max.z))),new v(new g(this.aabb.getCenter(new s),this.aabb.max)),new v(new g(this.aabb.min,this.aabb.getCenter(new s))),new v(new g(new s(this.aabb.getCenter(new s).x,this.aabb.min.y,this.aabb.min.z),new s(this.aabb.max.x,this.aabb.max.y,this.aabb.getCenter(new s).z)))]}}class ie{constructor(e,t,a,r){l(this,"lodRanges");l(this,"nodes",[]);l(this,"cameraPosition");l(this,"frustum");this.lodRanges=t,this.cameraPosition=r.clone(),this.frustum=a,this.selectLods(new v(e),t.length-1)}selectLods(e,t){return e.aabb.intersectsSphere(new D(this.cameraPosition,this.lodRanges[t]))?this.frustum.intersectsBox(e.aabb)?t===0?(this.nodes.push(e),!0):(e.aabb.intersectsSphere(new D(this.cameraPosition,this.lodRanges[t-1]))?e.children.forEach(a=>{a.lodLevel=t-1,this.selectLods(a,t-1)||this.nodes.push(a)}):(e.lodLevel=t,this.nodes.push(e)),!0):!0:!1}}const ne=`
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
`,ce=`
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
        vec2 fraction = fract(mesh_pos * vec2(resolution, resolution) * 0.5) * 2.0 / vec2(resolution, resolution);
        return vertex - fraction * morphValue;
    }

    void main() {
        // visualization: pass lod level for color tinting
        vLodLevel = int(floor(lodLevel));

        // position after moving and scaling tile
        vec3 worldPos = (instanceMatrix * vec4(position, 1.0)).xyz;

        float dist = length(cameraPosition - worldPos);
        float morphK = morphValue(dist);
        vec2 normalizedMeshPos = position.xz + vec2(0.5, 0.5);
        // morph in object space
        vec2 morphedPos = morphVertex(position.xz, normalizedMeshPos, morphK);

        vec3 morphedWorldPos = (instanceMatrix * vec4(morphedPos.x, 0.0, morphedPos.y, 1.0)).xyz;
        float noiseHeight = height(morphedWorldPos);
        vec3 finalPosition = vec3(morphedWorldPos.x, noiseHeight, morphedWorldPos.z);
        vWorldPos = finalPosition;

        vec3 n = calcNormal(morphedWorldPos);
        vNormal = n;

        gl_Position = projectionMatrix * viewMatrix * vec4(finalPosition, 1.0);
    }
`;var le="/terrain-cdlod/assets/grass.e270160d.png";const h=2e3,n=document.querySelector("canvas"),f=new O({canvas:n});f.setPixelRatio(window.devicePixelRatio);const ve=new X,z=new B,m=new G;m.scale.setScalar(45e4);z.add(m);const u={turbidity:{value:10},rayleigh:{value:3},mieCoefficient:{value:.005},mieDirectionalG:{value:.7},elevation:{value:35},azimuth:{value:180},exposure:f.toneMappingExposure},P=new s,ge=I.degToRad(90-u.elevation.value),fe=I.degToRad(u.azimuth.value);P.setFromSphericalCoords(1,ge,fe);u.sunPosition={value:P};m.material.uniforms=b(b({},m.material.uniforms),u);const c=new Q(75,n.offsetWidth/n.offsetHeight,.1,1e5);c.position.set(0,40,0);const d=new Y(c,f.domElement);d.dragToLook=!0;d.movementSpeed=100;d.rollSpeed=1;const H=6,L=Math.pow(2,H),q=9,de=H+q,p=Math.pow(2,de),he=new g(new s(p/-2,0,p/-2),new s(p/2,0,p/2)),me=1e3,M=[];for(let o=0;o<q;o++)M[o]=me*Math.pow(2,o);const ue=["#fa9f6e","#fafa6e","#27ecbd","#ff3ff7","#1b5eef","#fc0202","#35ff00","#1c6373","#ffffff"].map(o=>new Z(o)),S=new K(1,1,L,L);S.rotateX(-Math.PI/2);const C=new _(new Float32Array(h),1,!1,1);S.setAttribute("lodLevel",C);const R=$.loadTexture(le);R.wrapS=N;R.wrapT=N;const A=new J({uniforms:{resolution:{value:L},lodRanges:{value:M},colors:{value:ue},grass:{type:"t",value:R},sun:{value:P}},vertexShader:ce,fragmentShader:ne}),x=new ee(S,A,h);z.add(x);const U=te();document.body.appendChild(U.domElement);const pe=new oe;pe.add(A,"wireframe",!1);const V=()=>{requestAnimationFrame(V),d.update(ve.getDelta()),d.movementSpeed=Math.min(Math.max(20,Math.abs(c.position.y)*2),1e3);const o=new re().setFromProjectionMatrix(new F().multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse)),e=new ie(he,M,o,c.position);e.nodes.slice(0,h).forEach((t,a)=>{const r=t.aabb.getSize(new s).length()/Math.SQRT2;x.setMatrixAt(a,new F().compose(t.aabb.getCenter(new s),new se,new s(r,1,r))),C.set(Float32Array.from([t.lodLevel]),a)}),C.needsUpdate=!0,x.count=Math.min(e.nodes.length,h),x.instanceMatrix.needsUpdate=!0,f.render(z,c),U.update()},j=()=>{n.width=n.offsetWidth,n.height=n.offsetHeight,c.aspect=n.offsetWidth/n.offsetHeight,c.updateProjectionMatrix(),f.setSize(window.innerWidth,window.innerHeight)};window.addEventListener("resize",j);j();V();
