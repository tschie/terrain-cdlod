import {
  Box3,
  Clock,
  Color,
  Frustum,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  PerspectiveCamera,
  PlaneBufferGeometry,
  Quaternion,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector3,
  WebGLRenderer
} from "three";
import { Quadtree } from "./quadtree";
import { terrainFragmentShader } from "./fragmentShader.glsl";
import { terrainVertexShader } from "./vertexShader.glsl";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { Sky } from "three/examples/jsm/objects/Sky";
import grassUrl from "./grass.png";

// max number of tiles allowed to show (conservative estimate)
const MAX_INSTANCES = 2000

const canvas = document.querySelector("canvas");

const renderer = new WebGLRenderer({ canvas });
renderer.setPixelRatio(window.devicePixelRatio);

const clock = new Clock();

const scene = new Scene();

/** Sky **/
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const skyUniforms = {
  turbidity: { value: 10 },
  rayleigh: { value: 3 },
  mieCoefficient: { value: 0.005 },
  mieDirectionalG: { value: 0.7 },
  elevation: { value: 35 },
  azimuth: { value: 180 },
  exposure: renderer.toneMappingExposure,
};

const sun = new Vector3();
const phi = MathUtils.degToRad(90 - skyUniforms.elevation.value);
const theta = MathUtils.degToRad(skyUniforms.azimuth.value);
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms.sunPosition = { value: sun };

sky.material.uniforms = {
  ...sky.material.uniforms,
  ...skyUniforms,
};

/** Camera **/
const camera = new PerspectiveCamera(
  75,
  canvas.offsetWidth / canvas.offsetHeight,
  0.1,
  100000
);
camera.position.set(0, 40, 0);

const controls = new FlyControls(camera, renderer.domElement);
controls.dragToLook = true;
controls.movementSpeed = 100;
controls.rollSpeed = 1;

/** Terrain **/
const minLOD = 6;
const resolution = Math.pow(2, minLOD);
const numLevels = 9;
const maxLOD = minLOD + numLevels;
const maxScale = Math.pow(2, maxLOD);
const terrainBounds = new Box3(
  new Vector3(maxScale / -2, 0, maxScale / -2),
  new Vector3(maxScale / 2, 0, maxScale / 2)
);
const minLodDistance = 1000; // distance from camera where min LOD (most detailed) should be shown
const lodRanges = [];
for (let i = 0; i < numLevels; i++) {
  lodRanges[i] = minLodDistance * Math.pow(2, i);
}

// for visualization purposes: used to tint tiles based on their LOD
const colors = [
  "#fa9f6e",
  "#fafa6e",
  "#27ecbd",
  "#ff3ff7",
  "#1b5eef",
  "#fc0202",
  "#35ff00",
  "#1c6373",
  "#ffffff",
].map(c => new Color(c))

// single plane geometry shared by each terrain tile
// use half of resolution for "partial nodes"
// a "full node" will use 4 half resolution instances
const geometry = new PlaneBufferGeometry(1, 1, resolution / 2, resolution / 2);
geometry.rotateX(-Math.PI / 2); // flip to xz plane

// each tile keeps track of its LOD level
const lodLevelAttribute = new InstancedBufferAttribute(
  new Float32Array(MAX_INSTANCES),
  1,
  false,
  1
);

geometry.setAttribute("lodLevel", lodLevelAttribute);

const grassTexture = new TextureLoader().load(grassUrl)
grassTexture.wrapS = RepeatWrapping;
grassTexture.wrapT = RepeatWrapping;

const material = new ShaderMaterial({
  uniforms: {
    resolution: { value: resolution / 2 },
    lodRanges: { value: lodRanges },
    colors: {
      value: colors
    },
    grass: {
      type: "t",
      value: grassTexture,
    },
    sun: {
      value: sun
    }
  },
  vertexShader: terrainVertexShader,
  fragmentShader: terrainFragmentShader,
});

const instancedMesh = new InstancedMesh(geometry, material, MAX_INSTANCES);
scene.add(instancedMesh);

/** GUI **/
const stats = Stats();
document.body.appendChild(stats.domElement);

const gui = new GUI();
gui.add(material, "wireframe", false);

const animate = () => {
  requestAnimationFrame(animate);

  // update camera
  controls.update(clock.getDelta());

  controls.movementSpeed = Math.min(Math.max(20, Math.abs(camera.position.y) * 2), 1000);

  const frustum = new Frustum().setFromProjectionMatrix(
    new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  );

  // generate new quadtree from updated camera position
  const quadtree = new Quadtree(terrainBounds, lodRanges, frustum, camera.position);

  quadtree.nodes.slice(0, MAX_INSTANCES).forEach((node, i) => {
    // move and scale each tile
    const sideLength = node.aabb.getSize(new Vector3()).length() / Math.SQRT2;
    instancedMesh.setMatrixAt(
      i,
      new Matrix4().compose(
        node.aabb.getCenter(new Vector3()),
        new Quaternion(),
        new Vector3(sideLength, 1, sideLength)
      )
    );

    // set tile's lod level
    lodLevelAttribute.set(Float32Array.from([node.lodLevel]), i);
  });

  lodLevelAttribute.needsUpdate = true;
  instancedMesh.count = Math.min(quadtree.nodes.length, MAX_INSTANCES);
  instancedMesh.instanceMatrix.needsUpdate = true;

  renderer.render(scene, camera);

  stats.update();
};

// resize canvas on window resize
const resize = () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", resize);
resize();

animate();
