/*/ -------------------------------------
// Used Resources
// -------------------------------------

Code - Daffodil point cloud and color gradient: Make Beautiful 3D Flowers in p5.js: 1/2 by Kazuki Umeda https://www.youtube.com/watch?v=8fgJ6i96fTY

Code - Interactions and Background Particles: Scroll-Based Animation Course and Raycast and Mouse Events by Bruno Simon https://threejs-journey.com/lessons/scroll-based-animation, https://threejs-journey.com/lessons/raycaster-and-mouse-events

HDR Background (edited): https://polyhaven.com/a/scythian_tombs_2

Poem: Spring and All by William Carlos Williams

Font: Comfortaa designed by Johan Aakerlund

Used Claude.ai and Stack Overflow for inspiration, debugging and explanations

*/
// -------------------------------------
// Imports
// -------------------------------------

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";


// -------------------------------------
// Scene Setup
// -------------------------------------

const scene = new THREE.Scene();

const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

const camera = new THREE.PerspectiveCamera(
  35, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 0, 5);

cameraGroup.add(camera);

const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: canvas });
renderer.setClearAlpha(1); //Black background
renderer.setSize(window.innerWidth, window.innerHeight);
//document.body.appendChild(renderer.domElement);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;


// -------------------------------------
// HDR Background
// -------------------------------------

const hdrLoader = new HDRLoader();
hdrLoader.load("textures/SunnyBackground.hdr", (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = hdr;
  scene.environment = hdr;
});


// -------------------------------------
// Daffodil Point Cloud
// -------------------------------------

const sectionDistance = 4;

const dScale = 0.022;
const arows = 120; //defines max vertice amount for theta
const acols = 420; //defines max vertice amount for pi

const textureLoader = new THREE.TextureLoader() //Alpha-Image so Particles get circular shape
const particleTexture = textureLoader.load('textures/glow.png')

//d stands for daffodil, p stands for flower petal, a stands for amount

function createDaffodilGeometry(params = {}) {
  const {
    baseRadius = 80,
    scale = dScale,
    height = 250,
    curve1 = 0.7,
    curve2 = 0.45,
    pNum = 6,
    pLength = 80,
    pSharpness = 2,
    pBumpiness = 2.5,
    pBumpinessIntensity = 12,

    hue1 = 35, // base hue in degrees
    hue2 = 10, // base hue in degrees
    saturation = 150,

    rows = arows,
    cols = acols,

  } = params;


  // Helper functions

  function PointCloudShape(height, r, curve1, curve2, c) {   //creates Bell-Shape along r
    return height * Math.pow(Math.E, -curve2 * Math.pow(Math.abs(r), c))
             * Math.pow(Math.abs(r), curve1);
  }

  function bumpiness(pBumpiness, r, pBumpinessIntensity, angleDeg) { //curviness (bumpiness) of petals to make them apper more natural
    return 1 + pBumpiness * Math.pow(r, 2) * Math.sin(THREE.MathUtils.degToRad(pBumpinessIntensity * angleDeg));
  }

  function toRad(deg) { return THREE.MathUtils.degToRad(deg); } //connverting to radius

  // Creation of point grid

  const pointCloud = [];
  for (let rings = 0; rings < rows; rings++) {//equal spread of rings along the radius, amount of rings defined by arows
    pointCloud.push([]);
    for (let phi = 0; phi < cols; phi++) {
      const angleDeg = phi * 360 / cols; //equal spread of vertices along one circle (360°), vertice amount defined by column value
      const petalAngleDeg = (pNum / 2) * angleDeg; //ensuring right amount of sin waves around circle for exact amount of pNum
      const r = (pLength * Math.pow(Math.abs(Math.sin(toRad(petalAngleDeg))), pSharpness) + baseRadius) * rings / rows; //sin creates petals
      const x = r * Math.cos(toRad(angleDeg)); //converts the radius and angle into x and y coordinates
      const y = r * Math.sin(toRad(angleDeg)); //converts the radius and angle into x and y coordinates
      const z = PointCloudShape(height, r / 100, curve1, curve2, 1.5) - 200 + bumpiness(pBumpiness, r / 100, pBumpinessIntensity, angleDeg); //vertical height of each point
      pointCloud[rings].push(new THREE.Vector3(x, y, z));
    }
  };


  // Flatten grid into positions and color gradient

  const positions = [];
  const colors = [];
  const color = new THREE.Color();

  for (let rings = 0; rings < rows; rings++) {
    for (let phi = 0; phi < cols; phi++) {
      const p = pointCloud[rings][phi];
      positions.push(p.x * scale, p.y * scale, p.z * scale); //uniform scaling of daffodil

      const h = (hue1 - rings * (hue2 / 360)) / 360; //gradient from hue1 to hue2
      const s = (saturation - rings) / 80; //saturation fading out
      const lum = (2 - s) / 2; //converting saturation to luminosity
      const sl = s / (1 - Math.abs(2 * lum - 1)); //converting luminosity for setHSL
      color.setHSL(h, sl, lum);
      colors.push(color.r, color.g, color.b);
    }
  }


  // Buffer Geometry

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));


  geometry.center();

  return geometry;
}


// Material

const daffodilMaterial = new THREE.PointsMaterial({
  size: 0.05,
  alphaMap: particleTexture,
  vertexColors: true,
  transparent: true,
  depthWrite: false,
});


const dPetals = new THREE.Points(createDaffodilGeometry(), daffodilMaterial);

dPetals.position.y = -sectionDistance * 0;
dPetals.position.x = 1.8;


//Daffodil-Trumpet

const dTrumpetGeometry = createDaffodilGeometry({

    baseRadius: 100,
    scale: dScale /2,
    height: 675,
    curve1: 3,
    curve2: 1,
    pNum: 20,
    pLength: 10,
    pSharpness: 0.2,
    pBumpiness: 10,
    pBumpinessIntensity: 7,

    hue1: 25,
    hue2: 30,
    saturation: 150,

    rows: arows,
    cols: acols / 2
});

const dTrumpet = new THREE.Points(dTrumpetGeometry, daffodilMaterial);
dTrumpet.position.set(dPetals.position.x, dPetals.position.y, 1.25);


//Grouping dPetals and dTrumpet

const daffodilGroup = new THREE.Group();
daffodilGroup.add(dPetals, dTrumpet);
scene.add(daffodilGroup);
const sectionMeshes = [daffodilGroup];


// -------------------------------------
// Background Particles
// -------------------------------------

const particlesCount = 1000;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++){
  positions[i * 3 + 0] = (Math.random() -0.5) * 10, //random x position
  positions[i * 3 + 1] = sectionDistance * 0.5 - Math.random() * sectionDistance * sectionMeshes.length, //random y position
  positions[i * 3 + 2] = (Math.random() -0.5) * 10 //random z position
};

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.02,
  alphaMap: particleTexture,
  transparent: true,
  depthWrite: false,
  sizeAttenuation: true,
  color: 0xffffff
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);


// -------------------------------------
// Interaction
// -------------------------------------

// Camera-Movement on y-axis when scrolling and repositioning of daffodil when entering section 3

let scrollY = window.scrollY;
let currentSection = 0;
const targetRotation = { x: 0, y: 0, z:0 };
const targetMove = { x: 0, y: 0, z:0 };


window.addEventListener('scroll', () => {
  scrollY = window.scrollY;

  const newSection = Math.round(scrollY / window.innerHeight); //getting current section

  if (newSection !== currentSection) {
    currentSection = newSection;

    const sectionRotations = { //daffodil rotation over sections
      0: { x: 0, y: -0.25, z: 0},
      1: { x: 0, y: 0, z: 0},
      2: { x: 0.5, y: -0.5, z: -1},
    };

        const sectionMoves = { //daffodil Position over sections
      0: { x: 0, y: 0, z: 0},
      1: { x: 0, y: 0, z: 0},
      2: { x: 3.15, y: 7.1, z: -3.5},
    };

    const rotation = sectionRotations[currentSection] ?? { x: 0, y: 0, z:0 };
    targetRotation.x = rotation.x;
    targetRotation.y = rotation.y;
    targetRotation.z = rotation.z;

    const move = sectionMoves[currentSection] ?? { x: 0, y: 0, z:0 };
    targetMove.x = move.x;
    targetMove.y = move.y;
    targetMove.z = move.z;
  }
});


// Daffodil Particles Interaction

const dPetalsOriginalPositions = dPetals.geometry.attributes.position.array.slice(); //getting dpetals original position, saving the orginal position with slice
const trumpetOriginalPositions = dTrumpet.geometry.attributes.position.array.slice(); //getting dtrumpets original position, saving the orginal position with slice

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mousePos3D = new THREE.Vector3();

window.addEventListener('mousemove', (e) => { //converting mouses screen position from pixel to x,y coordinates and converting them for three.js
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});


// -------------------------------------
// Animation Loop
// -------------------------------------

let previousTime = performance.now();


function animate() {


// Particle Animation

raycaster.setFromCamera(mouse, camera); 
const intersects = raycaster.intersectObjects([dPetals, dTrumpet]); //Updating mouse3dPos when raycaster points to any daffodil points
if (intersects.length > 0) {
  mousePos3D = intersects[0].point;
}

[dPetals, dTrumpet].forEach((mesh, i) => {
  const positions = mesh.geometry.attributes.position.array;
  const originalPosition = i === 0 ? dPetalsOriginalPositions : trumpetOriginalPositions; //decides which geometry is selected (0 = dPetals, 1 = dTrumpet)
  const radius = 1.2; //raycaster radius
  const strength = 0.3; //strength of particle spreading
  const lerpSpeed = 0.04; //speed with which particles move back to their original position

  for (let particleNum = 0; particleNum < positions.length; particleNum += 3) {
    const worldPos = new THREE.Vector3(
      originalPosition[particleNum], originalPosition[particleNum + 1], originalPosition[particleNum + 2]
    ).applyMatrix4(mesh.matrixWorld); //converting from local coodinates to world coordinates to get particles current position seperated from interaction

    const dist = worldPos.distanceTo(mousePos3D); //distance between mouse position and particle position

    if (dist < radius) {
      const dir = worldPos.sub(mousePos3D).normalize(); //mouse pointing direction
      const force = (0.8 - dist / radius) * strength; //force is stronger when particle is closer to mouse to restriction uncontrollable distrcution of daffodil
      positions[particleNum]     += dir.x * force; //Particle coordinate is altered by force amount
      positions[particleNum + 1] += dir.y * force; 
      positions[particleNum + 2] += dir.z * force;
    } else {
      positions[particleNum]     += (originalPosition[particleNum]     - positions[particleNum])     * lerpSpeed; //Brings back the particle to og position by slowing the closer it gets to og Position
      positions[particleNum + 1] += (originalPosition[particleNum + 1] - positions[particleNum + 1]) * lerpSpeed;
      positions[particleNum + 2] += (originalPosition[particleNum + 2] - positions[particleNum + 2]) * lerpSpeed;
    }
  }

  mesh.geometry.attributes.position.needsUpdate = true;
});

//Slight Camera Movement when mouse movement

    const currentTime = performance.now();
    previousTime = currentTime;

  camera.position.y = - scrollY / window.innerHeight * sectionDistance;

  const parallaxX = mouse.x * 0.5;
  const parallaxY = - mouse.y * 0.5;
  cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 0.05;
  cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 0.05;


  //Rotation of daffodil when entering section 3

  for(const mesh of sectionMeshes)
    {
    mesh.rotation.x += (targetRotation.x - mesh.rotation.x) * 0.05;
    mesh.rotation.y += (targetRotation.y - mesh.rotation.y) * 0.05;
    mesh.rotation.z += (targetRotation.z - mesh.rotation.z) * 0.05;

    mesh.position.x += (targetMove.x - mesh.position.x) * 0.05;
    mesh.position.y += (targetMove.y - mesh.position.y) * 0.05;
    mesh.position.z += (targetMove.z - mesh.position.z) * 0.05;
    };

  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  controls.update();
}

animate();

// -------------------------------------
// Resize
// -------------------------------------

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});



