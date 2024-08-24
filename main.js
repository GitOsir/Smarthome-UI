import { Scene } from 'three';
import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import {Model,Lightswitch, ClickVolume,Cover} from './model';
import * as Util from './util';
  
import * as TWEEN from '@tweenjs/tween.js';
import { randFloat } from 'three/src/math/mathutils';
import Stats from 'stats.js';



let mousePos = new THREE.Vector2(0,0);
let previousRoom;
const hdrTexture = new URL('./models/empty_workshop_4k.hdr',import.meta.url);
//---Setup-----------------------------------------------------------------
const screenAspectRatio = window.innerWidth / window.innerHeight

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, screenAspectRatio, 0.1,1000)
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("canvas"),
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xe3e3e3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
camera.position.set(1.5,90,90);

renderer.render(scene,camera);

document.getElementById("LeaveRoom").style.visibility="hidden";

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

const rgbeLoader = new RGBELoader();
rgbeLoader.load(hdrTexture, (texture) =>{
    scene.environment = texture;

})

//Lighting-------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, .8);
const dirLight = new THREE.DirectionalLight(0xffffff,2);
dirLight.position.set(40,60,-25);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 512;
dirLight.shadow.mapSize.height = 512;
dirLight.shadow.camera.top = 55;
dirLight.shadow.camera.bottom = - 30;
dirLight.shadow.camera.left = - 30;
dirLight.shadow.camera.right = 50;
dirLight.shadow.bias = -0.001;


const areaLight = new THREE.RectAreaLight(0xf7fadc,5,50,50);
areaLight.position.set(0,200,-80);
//areaLight.rotateX(-Math.PI/2);
areaLight.lookAt(new THREE.Vector3(0,0,0));
const hemisphereLight = new THREE.HemisphereLight( 0xb5b48b, 0x080820, 1 );

scene.add(dirLight,ambientLight,areaLight,hemisphereLight);

//Three js helpers------------------------------------------------------
//const dirLightHelper = new THREE.DirectionalLightHelper(dirLight);
const arelightHelper = new THREE.PointLightHelper(areaLight);
const gridHelper = new THREE.GridHelper(1000,100);
scene.add(arelightHelper);

const controls = new OrbitControls(camera,renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = .2;
controls.enablePan = false;
controls.minPolarAngle =  Math.PI / 4;
controls.maxPolarAngle = Math.PI / 4;

//load custom models----------------------------------------
const erdgeschoss = new Model("./models/Haus_Erdgeschoss.glb");
erdgeschoss.position.set(0,0,0);
erdgeschoss.name = "erdgeschoss";
const obergeschoss = new Model("./models/Haus_Obergeschoss.glb");
obergeschoss.position.set(0,0,0)
const dach = new Model("./models/Dach.glb");
dach.position.set(0,0,0);

const groundPlanegeometrie = new THREE.PlaneGeometry(1000,1000);
const groundPlaneMat = new THREE.MeshPhysicalMaterial({
    color: 0xadadad,
});

const groundPlaneMesh = new THREE.Mesh(groundPlanegeometrie,groundPlaneMat);
groundPlaneMesh.position.set(0,-1,0);
groundPlaneMesh.rotation.set(Math.PI /2,Math.PI,0);
groundPlaneMesh.receiveShadow = true;

scene.add(erdgeschoss,obergeschoss,dach,groundPlaneMesh);

//------IoT Oben----------------------------------------------
const allSwitchesOben = new THREE.Group();
const coverOben = new THREE.Group();
const lightsOben = new THREE.Group();
const lightDavidVorn = new Lightswitch("light","light.marc_led_panel_vorn");
lightDavidVorn.position.set(17,15,0);
const lightDavidhinten = new Lightswitch("light","light.marc_led_panel_hinten");
lightDavidhinten.position.set(17,15,-15);
const coverDavid = new Cover("cover", "cover.marc_rollo_kl_fenster");
coverDavid.position.set(27,21,-2);
coverDavid.rotateY(-Math.PI/4);

const lightBadToilette = new Lightswitch("switch","switch.bad_4fach_schalter_bad_led1_neq0168649_state_ch1");
lightBadToilette.position.set(2,15,-24);
const lightBadSpiegel = new Lightswitch("switch","switch.bad_4fach_schalter_bad_spiegel_neq0168649_state_ch4");
lightBadSpiegel.position.set(-5,15,-24);
const lightBad = new Lightswitch("switch","switch.bad_4fach_schalter_bad_led2_neq0168649_state_ch2");
lightBad.position.set(-13,15,-24);

const lightSchlafzimmer = new Lightswitch("light","light.schlafzimmer_decke");
lightSchlafzimmer.position.set(-20,15,20);
const lightSchlafzimmerNaschttischKerstin = new Lightswitch("light","light.schlafzimmer_nachttisch_kerstin");
lightSchlafzimmerNaschttischKerstin.position.set(-32,15,26);
const lightSchlafzimmerNaschttischNorman = new Lightswitch("light","light.schlafzimmer_nachttisch_norman");
lightSchlafzimmerNaschttischNorman.position.set(-32,15,14);
const coverSchlafzimmer = new Cover("cover", "cover.schlafzimmer_rollo"); 
coverSchlafzimmer.position.set(-22,21,30);
coverSchlafzimmer.rotateY(Math.PI/2);

lightsOben.add(lightDavidVorn,lightDavidhinten,lightBadToilette,lightSchlafzimmer,lightSchlafzimmerNaschttischKerstin,lightSchlafzimmerNaschttischNorman,lightBadSpiegel,lightBad);
coverOben.add(coverDavid,coverSchlafzimmer);
allSwitchesOben.add(lightsOben,coverOben);
//---Clickvolumes oben----------------------------------------------
const clickVolumesOben = new THREE.Group();
const clickVolumeDavid = new ClickVolume(23,15,38,new THREE.Vector3(25,43,19));
clickVolumeDavid.position.set(18,25,-10)
const clickVolumeBadOben = new ClickVolume(26,15,12,new THREE.Vector3(-7,41,-39));
clickVolumeBadOben.position.set(-7,25,-24);
const clickVolumeFlurOben = new ClickVolume(26,15,23,new THREE.Vector3(-6,44,17));
clickVolumeFlurOben.position.set(-7,25,-5);
const clickVolumeBen = new ClickVolume(15,15,34,new THREE.Vector3(-36,39,-36));
clickVolumeBen.position.set(-28,25,-12);
const clickVolumeSchlafzimmer = new ClickVolume(25,15,27,new THREE.Vector3(-5,48,33));
clickVolumeSchlafzimmer.position.set(-22,25,19);


clickVolumesOben.add(clickVolumeDavid,clickVolumeBadOben,clickVolumeFlurOben,clickVolumeBen,clickVolumeSchlafzimmer);
clickVolumesOben.name = "clickVolumesOben";
//---ObergeschossGroup----------------------------------------------

const obergeschossGroup = new THREE.Group();
obergeschossGroup.add(allSwitchesOben, obergeschoss,clickVolumesOben);
scene.add(obergeschossGroup);

//------IoT Unten----------------------------------------------

const iotSwitchesUnten = new THREE.Group();
const lightsUnten = new THREE.Group();

const wohnzimmerLicht = new Lightswitch("light", "light.led_decke");
wohnzimmerLicht.position.set(17,10,-10);



lightsUnten.add(wohnzimmerLicht);
iotSwitchesUnten.add(lightsUnten);


//Clickvolumes Unten-------------------------------------------
const clickVolumesUnten = new THREE.Group();

const clickVolumeWohnzimmer = new ClickVolume(23,15,38,new THREE.Vector3(25,43,19));
clickVolumeWohnzimmer.position.set(17,9,-10);
const clickVolumeFlurEG = new ClickVolume(26,15,19,new THREE.Vector3(-8,37,11));
clickVolumeFlurEG.position.set(-8,9,-4.5);
const clickVolumeKueche = new ClickVolume(40,15,19,new THREE.Vector3(-13,46,-32));
clickVolumeKueche.position.set(-14,9,-21);

clickVolumesUnten.add(clickVolumeWohnzimmer,clickVolumeFlurEG,clickVolumeKueche);
clickVolumesUnten.name = "clickVolumesUnten";
//Erdgeschossgroup---------------------------------------------
const erdgeschossGroup = new THREE.Group();
erdgeschossGroup.add(iotSwitchesUnten, erdgeschoss,clickVolumesUnten);
scene.add(erdgeschossGroup,iotSwitchesUnten);
//-----------------------------------------------------------

//--Get States from entities----------------------------------------
for(let i = 0; i < coverOben.children.length;i++){
    coverOben.children[i].GetState();
}
for(let i = 0; i < lightsOben.children.length;i++){
    lightsOben.children[i].GetState();
}
for(let i = 0; i < lightsUnten.children.length;i++){
    lightsUnten.children[i].GetState();

}
//---------------------------------------------------------------------




function Update(time){
    renderer.render(scene,camera);
    TWEEN.update(time);
    controls.update();
    window.requestAnimationFrame(Update);
}
Update();




Util.GetServices();

let selectedElement;

document.addEventListener("keydown", (e) =>{
    if(e.keyCode == 38){
        selectedElement.position.z --;
    }else if(e.keyCode == 40){
        selectedElement.position.z ++;
    }else if(e.keyCode == 37){
        selectedElement.position.x --;
    }else if(e.keyCode == 39){
        selectedElement.position.x ++;
    }else if(e.keyCode == 104){
        selectedElement.position.y ++;
    }else if(e.keyCode == 98){
        selectedElement.position.y --;
    }else if(e.keyCode == 101){
        console.log("CamPos: " + Math.round(camera.position.x) + "," + Math.round(camera.position.y) + "," + Math.round(camera.position.z));
    }
    console.log(selectedElement.position.x +","+selectedElement.position.y+","+selectedElement.position.z);

}, false);

document.addEventListener("click", (event)=>{

    let raycaster = new THREE.Raycaster();
    console.log("click");
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mousePos,camera);
    let intersects = raycaster.intersectObject(scene);
    if(intersects.length == 0){return;}
    //Debug----------------
    selectedElement = intersects[0].object;
    //-------------------------------------
    if(intersects[0].object.parent.parent == null){return;}
    if(intersects[0].object.parent.parent.name == "switch"){
        console.log(intersects);
        intersects[0].object.parent.parent.toggle();
    }else if(intersects[0].object.parent.name == "switch"){
        intersects[0].object.parent.toggle();
    }else if(intersects[0].object.parent.name == "clickVolume"){

        checkClickVolume(intersects);

    }


});

function checkClickVolume(intersects){
    console.log(intersects[0].object.parent.parent.name);
    let clickVolumeFloor = intersects[0].object.parent.parent.name == "clickVolumesOben" ? 1 : 2;


    if(floorIndex != clickVolumeFloor){return;}
    if(previousRoom != null){
        if(previousRoom.inRoom){return};
    }
    intersects[0].object.parent.MoveCameraToRoom(camera,controls);
    previousRoom = intersects[0].object.parent;
}


const floors = [dach,obergeschossGroup,erdgeschossGroup];
let floorIndex = 0;
let currentActiveFloor = floors[floorIndex];
let inAnimation = false;


document.getElementById("switchFloorDOWN").addEventListener("click", ()=>{
    if(previousRoom != null){
        if(previousRoom.inRoom){return};
    }
    if(currentActiveFloor == erdgeschossGroup || inAnimation){return;}
    const tween = new TWEEN.Tween({floorY: currentActiveFloor.position.y})
    .to({floorY:currentActiveFloor.position.y + 300},1000)
    .onUpdate((coords) =>{
        currentActiveFloor.position.y = coords.floorY;
        inAnimation = true;
    })
    .easing(TWEEN.Easing.Exponential.InOut)
    .onComplete(()=>{
        floorIndex++;
        currentActiveFloor = floors[floorIndex];
        inAnimation = false;
    });
    if(floorIndex == 0){
        lightFadeAnimation(15,25, TWEEN.Easing.Cubic.Out, lightsOben);
    }else if(floorIndex == 1){
        lightFadeAnimation(5,10, TWEEN.Easing.Cubic.Out, lightsUnten);
    }

    tween.start();
});
document.getElementById("switchFloorUP").addEventListener("click", ()=>{
    if(previousRoom != null){
        if(previousRoom.inRoom){return};
    }
    if(currentActiveFloor == dach || inAnimation){return;}
    floorIndex--;
    currentActiveFloor = floors[floorIndex];
    const tween = new TWEEN.Tween({y: currentActiveFloor.position.y})
    .to({y:currentActiveFloor.position.y - 300},1000)
    .onUpdate((coords) =>{
        currentActiveFloor.position.y = coords.y;
        inAnimation = true;
    })
    .easing(TWEEN.Easing.Exponential.InOut)
    .onComplete(()=>{
        inAnimation = false;
    });
    if(floorIndex == 0){
        lightFadeAnimation(25,15,TWEEN.Easing.Cubic.InOut, lightsOben)
    }
    tween.start();

});

function lightFadeAnimation(y1,y2, easing, floor){
    for(let i = 0; i < floor.children.length;i++){
        let light = floor.children[i];
        const lightTween = new TWEEN.Tween({y:y1})
        .to({y: y2},randFloat(1000,2500))
        .onUpdate((coords)=>{
            light.position.y = coords.y;
        })
        .easing(easing);
        lightTween.start();
    }
}

