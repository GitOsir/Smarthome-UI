import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { config } from './config';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as TWEEN from '@tweenjs/tween.js';

const hdrEquirect = new RGBELoader().load(
  "./models/empty_workshop_4k.hdr",
  () => {
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
  }
);

class MODEL extends THREE.Group {
    constructor(_modelUrl) {
      super();
      this.modelPath = _modelUrl;
      this.onCreate();
    }
  
    onCreate() {
      new GLTFLoader().load(
        this.modelPath,
        gltf => {
          const model = gltf.scene;
          model.traverse((node)=>{
            node.castShadow = true;
            node.receiveShadow = true;
          })
          this.add(model);
        }
      );
    }
}
class CLICKVOLUME extends THREE.Group{
  constructor(_width, _height, _depth,_targetCamPos){
      super();
      this.width = _width;
      this.height = _height;
      this.depth = _depth;
      this.targetCamPos = _targetCamPos;

      this.name = "clickVolume"
      this.inRoom = false;
      this.animationspeed = 1000;

      this.normalRotationRadius;
      this.onCreate();
  }
  onCreate() {
    const geometrie = new THREE.BoxGeometry(this.width,this.height,this.depth);
    const mat = new THREE.MeshStandardMaterial({wireframe: true})
    const _mesh = new THREE.Mesh(geometrie,mat);
    this.add(_mesh);
    this.mesh = _mesh;
    this.mesh.visible = false;
  }
  MoveCameraToRoom(camera, controls){
    this.mesh.layers.disable(0);

    this.inRoom = true;
    this.targetCamLookAt = new THREE.Vector3(this.position.x, this.position.y - this.height/2, this.position.z);

    let leaveButton = document.getElementById("LeaveRoom");
    leaveButton.style.visibility="visible";
    const cameraTween = new TWEEN.Tween(camera.position)
    .to(this.targetCamPos,this.animationspeed)
    .easing(TWEEN.Easing.Cubic.Out)
    .onComplete(()=>{
      leaveButton.addEventListener("click",()=>{
        this.LeaveRoom(camera,controls);
      });
    });

    const controlsTargetTween = new TWEEN.Tween(controls.target)
    .to(this.targetCamLookAt,this.animationspeed)
    .easing(TWEEN.Easing.Exponential.Out);
    cameraTween.start();
    controlsTargetTween.start()
    controls.autoRotate = false;

    this.normalRotationRadius = camera.position.distanceTo(new THREE.Vector3());
  }
  LeaveRoom(camera,controls){
    document.getElementById("LeaveRoom").style.visibility="hidden";
    let currentRotationRadius = camera.position.distanceTo(new THREE.Vector3());
    let currentRadiusPercentage = this.normalRotationRadius / currentRotationRadius;
    let targetPos = new THREE.Vector3(camera.position.x * currentRadiusPercentage,
                                      camera.position.y * currentRadiusPercentage,
                                      camera.position.z * currentRadiusPercentage);
    const cameraTween = new TWEEN.Tween(camera)
    .to({position: targetPos},this.animationspeed)
    .easing(TWEEN.Easing.Exponential.Out)
    .onComplete(()=>{
      controls.autoRotate = true;
      this.mesh.layers.enable(0);
      this.inRoom = false;
    });
    const controlsTargetTween = new TWEEN.Tween(controls.target)
    .to({x: 0, y: 0,z:0},this.animationspeed)
    .easing(TWEEN.Easing.Exponential.Out);
    cameraTween.start();
    controlsTargetTween.start()

  }


}
class LIGHTSWITCH extends THREE.Group{
  constructor(service,_entity){
      super();
      this.entity = _entity;
      this.modelPath_TOP = "./models/light_bulb_top.glb";
      this.modelPath_BOTTOM = "./models/light_bulb_bottom.glb"
      this.POSTapiURL = `${config.api.url}/services/${service}/toggle`
      this.GETapiURL = `${config.api.url}/states/${this.entity}`

      this.name = "switch";
      this.lightIntensity = 100;
      
      this.state = false;
      this.onCreate();
  }
  onCreate() {
    const loader = new GLTFLoader()
    loader.load(
      this.modelPath_TOP,
      gltf => {
        this.MakeGlassMaterial(gltf.scene);
        this.add(gltf.scene);
        this.bulb = gltf.scene;
      }
    );
    loader.load(
      this.modelPath_BOTTOM,
      gltf => {
        this.add(gltf.scene);
      }
    );
    //this.areaLight = new THREE.SpotLight(0xffffff,0,15,Math.PI / 2,1);
    this.areaLight = new THREE.RectAreaLight(0xffffff,this.lightIntensity,1,1);
    this.areaLight.rotateX(-Math.PI/2);
    this.SpotLightTarget = new THREE.Object3D();
    this.SpotLightTarget.position.set(0,-1,0);
    this.areaLight.target = this.SpotLightTarget;

    this.add(this.areaLight, this.SpotLightTarget);
  }
  MakeGlassMaterial(model) {
    model.traverse(child => {
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,  
        roughness: .2,
        transmission: 1,
        thickness: 1,
        emissive: 0xc5d914,
        emissiveIntensity: 0,
        envMap: hdrEquirect,
      });
    });
  }
  UpdateGlassMaterial(){
    let emission = (this.state == true) ? 10 : 0;
    this.bulb.traverse(child => {
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,  
        roughness: .2,
        transmission: 1,
        thickness: 1,
        emissive: 0xc5d914,
        emissiveIntensity: emission,
        envMap: hdrEquirect,
      });
    });
  }
  async toggle(){
    const apiKey = config.api.token;
    const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body:`{
            "entity_id": "${this.entity}"
        }`,
      };
    const read = await fetch(this.POSTapiURL,requestOptions);
    const responseJson = await read.json();
    console.log(responseJson);
    this.GetState();

  }

  async GetState(){
    const apiKey = config.api.token;
    const requestOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      };
    const read = await fetch(this.GETapiURL,requestOptions);
    const json = await read.json()
    this.state = (json.state == "on") ? true : false;
    this.UpdateGlassMaterial();
    this.areaLight.intensity = (this.state == true) ? this.lightIntensity : 0;
  }
}

class COVER extends THREE.Group{
  constructor(service,_entity){
    super();
    this.entity = _entity;
    this.POSTapiURL = `${config.api.url}/services/${service}/toggle`
    this.GETapiURL = `${config.api.url}/states/${this.entity}`
    this.apiTryCounter = 0;

    this.modelPath = "./models/arrow.glb";

    this.name = "switch";
    
    this.state;
    this.onCreate();
}
onCreate() {
  const outerGeometrie = new THREE.SphereGeometry(1);
  const outerMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,  
    roughness: .5,
    transmission: 1,
    thickness: .001,
    emissive: 0xc5d914,
    emissiveIntensity: 0,
    envMap: hdrEquirect,
  })
  const outerSphere = new THREE.Mesh(outerGeometrie,outerMaterial);

  const innerGeometrie = new THREE.SphereGeometry(.5);
  const innerMaterial = new THREE.MeshStandardMaterial({
    metalness: .6,
    emissive: 0xc5d914,
    emissiveIntensity: 3,
  });
  const innerSphere = new THREE.Mesh(innerGeometrie,innerMaterial);
  this.innerSphere = innerSphere;
  const loader = new GLTFLoader()
  loader.load(
    this.modelPath,
    gltf => {
      this.UpdateMaterial(gltf.scene,new THREE.Color(0x16e035));
      this.add(gltf.scene);
      gltf.scene.position.set(0,0,.8);
      gltf.scene.scale.set(.1,.1,.1);
      this.innerMesh = gltf.scene;
      this.add(outerSphere,innerSphere,gltf.scene);
    }
  );


}
UpdateState(){
  switch (this.state){
    case "opening":
      this.UpdateMaterial(this.innerMesh,new THREE.Color(0x4d66e8));
      this.innerMesh.rotation.set(0,0,0);
      break;
    case "closing":
      this.UpdateMaterial(this.innerMesh,new THREE.Color(0x4d66e8));
      this.innerMesh.rotation.set(0,0,Math.PI);
      break;
    case "open":
      this.UpdateMaterial(this.innerMesh,new THREE.Color(0x16e035));;
      this.innerMesh.rotation.set(0,0,0);
      break;
    case "closed":
      this.UpdateMaterial(this.innerMesh,new THREE.Color(0xe65853));
      this.innerMesh.rotation.set(0,0,Math.PI);
      break;
  }
}
UpdateMaterial(mesh, emissiveColor){
  mesh.traverse((node) =>{
    node.material = new THREE.MeshStandardMaterial({
      metalness: .8,
      emissive: emissiveColor,
      emissiveIntensity: 2,
    })
  });
  this.innerSphere.material.emissive = emissiveColor;
}
async toggle(){
  const apiKey = config.api.token;
  const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body:`{
          "entity_id": "${this.entity}"
      }`,
    };
  const read = await fetch(this.POSTapiURL,requestOptions);
  const responseJson = await read.json();
  console.log(responseJson);
  this.GetState();

}

async GetState(){

  const apiKey = config.api.token;
  const requestOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    };
  const read = await fetch(this.GETapiURL,requestOptions);
  const json = await read.json()
  console.log(json);
  this.state = json.state;

  this.UpdateState();
  if(this.apiTryCounter >= 10 || this.state == "open" || this.state == "closed"){return;}
  this.apiTryCounter++
  setTimeout(() => {
    this.GetState();
  }, 10000);
}
}



export {MODEL as Model,CLICKVOLUME as ClickVolume ,LIGHTSWITCH as Lightswitch, COVER as Cover};