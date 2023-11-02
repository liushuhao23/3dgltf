<!-- eslint-disable prefer-destructuring -->
<!-- eslint-disable no-bitwise -->
<!-- eslint-disable no-mixed-operators -->
<!-- eslint-disable max-len -->
<!--
 * @Description: description
 * @Version: 2.0
 * @Autor: liushuhao
 * @Date: 2023-11-01 22:23:26
 * @LastEditors: liushuhao
 * @LastEditTime: 2023-11-02 18:02:13
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';

const container: any = ref(null);
let map: any = null;

let camera: any;
let renderer: any;
let scene: any;
const nodesList: any = ref([]);
let object: any;
let customCoords: any;

// const renderer = new THREE.WebGLRenderer();
const selectedObject: THREE.Object3D | null = null;
const objPosition = [116.397428, 39.90923];
const originalColors = new Map();

function setPosition(lnglat: number[]) {
  // 对模型的经纬度进行转换
  const position = customCoords.lngLatsToCoords([lnglat])[0];
  object.position.setX(position[0]);
  object.position.setY(position[1]);
}

function initGltf() {
  const loader = new GLTFLoader();
  const url = 'https://xland-test6.cbim.org.cn/tianshan/gisconfig/layer/downloadFile/default_accountId_jiuZhou/1718931449765834752/1/main.gltf';

  // const url = 'https://xland-test6.cbim.org.cn/tianshan/gisconfig/layer/downloadFile/default_accountId_jiuZhou/1717727997668765696/1/main.gltf';
  // const url = 'https://xland-test6.cbim.org.cn/tianshan/gisconfig/layer/downloadFile/default_accountId_jiuZhou/1718931446922096640/1/main.gltf';
  loader.load(url, (gltf: { scene: any }) => {
    object = gltf.scene;
    gltf.scene.traverse((child: any) => {
      if (child.type !== 'Group') {
        originalColors.set(child.name, child.material.color.clone());
        nodesList.value.push(child);
      }
    });
    // const node = gltf.scene.getObjectByName("yourNodeName");
    console.log('输出object', object);
    object.scale.set(30, 30, 30);
    // setRotation({
    //   x: 90, y: 0, z: 0,
    // });
    setPosition(objPosition);
    scene.add(object);
  });
}

onMounted(() => {
  AMapLoader.load({
    key: '7d6c80e42046ec2f06899eb4d7f7a352', // 申请好的Web端开发者Key，首次调用 load 时必填
    version: '2.0',
    plugins: [], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
  })
    .then((AMap) => {
      map = new AMap.Map('container', {
        // 设置地图容器id
        viewMode: '3D', // 是否为3D地图模式
        zoom: 14, // 初始化地图级别
        center: [116.397428, 39.90923], // 初始化地图中心点位置
      });
      // eslint-disable-next-line prefer-destructuring
      customCoords = map.customCoords;
      // 数据使用转换工具进行转换，这个操作必须要提前执行（在获取镜头参数 函数之前执行），否则将会获得一个错误信息。
      // const data = customCoords.lngLatsToCoords([[116.271363, 39.992414]]);
      const gllayer = new AMap.GLCustomLayer({
        // 图层的层级
        zIndex: 10,
        // 初始化的操作，创建图层过程中执行一次。
        init: (gl: any) => {
          // 这里我们的地图模式是 3D，所以创建一个透视相机，相机的参数初始化可以随意设置，因为在 render 函数中，每一帧都需要同步相机参数，因此这里变得不那么重要。
          // 如果你需要 2D 地图（viewMode: '2D'），那么你需要创建一个正交相机
          // eslint-disable-next-line no-bitwise
          camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            100,
            1 << 30,
          );

          renderer = new THREE.WebGLRenderer({
            context: gl, // 地图的 gl 上下文
          });
          renderer.outputEncoding = THREE.sRGBEncoding;
          // 自动清空画布这里必须设置为 false，否则地图底图将无法显示
          renderer.autoClear = false;
          scene = new THREE.Scene();

          const lightness = new THREE.HemisphereLight(0xffffff, 0x444444);
          lightness.position.set(0, 20, 0);
          scene.add(lightness);
          const shadowLight = new THREE.DirectionalLight(0xffffff);
          shadowLight.position.set(0, 20, 10);
          scene.add(shadowLight);
          // 改变模型位置和角度
          // const centerPoint = turf.point([116.271363, 39.992414]);

          initGltf();
        },
        render: () => {
          // 这里必须执行！！重新设置 three 的 gl 上下文状态。
          renderer.resetState();
          // 重新设置图层的渲染中心点，将模型等物体的渲染中心点重置
          // 否则和 LOCA 可视化等多个图层能力使用的时候会出现物体位置偏移的问题
          customCoords.setCenter([116.271363, 39.992414]);
          const {
            near, far, fov, up, lookAt, position,
          } = customCoords.getCameraParams();
          camera.near = near;
          camera.far = far;
          camera.fov = fov;
          camera.position.set(...position);
          camera.up.set(...up);
          camera.lookAt(...lookAt);
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);

          // 这里必须执行！！重新设置 three 的 gl 上下文状态。
          renderer.resetState();
        },
      });
      map.add(gllayer);
    })
    .catch((e) => {
      console.log(e);
    });
});

const oldCurrentColor: any = ref();
const oldCurrentNode = ref('');
const goNode = (item: any) => {
  // 如果点击的是当前已选中的节点，则不执行任何操作
  if (item.name === oldCurrentNode.value) return;

  // 将当前节点的颜色设置为高亮（例如：浅绿色）
  const current = object.getObjectByName(item.name);
  (current.material as THREE.Material).color.set('rgb(144,238,144)');

  // 如果先前有选中的节点，则恢复其原始颜色
  if (oldCurrentNode.value) {
    const oldNode = object.getObjectByName(oldCurrentNode.value);
    if (oldNode) {
      const originalColor = originalColors.get(oldCurrentNode.value);
      if (originalColor) {
        oldNode.material.color.copy(originalColor);
      }
    }
  }

  // 更新oldCurrentNode以备后用
  oldCurrentNode.value = item.name;

  map.render();
};

// const goNode = (item: any) => {
//   console.log('输出item', item);
//   if (item.name === oldCurrentNode.value) return;
//   oldCurrentColor.value = item.material.color;
//   const r = item.material.color.r;
//   const g = item.material.color.g;
//   const b = item.material.color.b;
//   oldCurrentColor.value = { r, g, b };
//   const current = object.getObjectByName(item.name);
//   (current.material as THREE.Material).color.set('rgb(144,238,144)');
//   console.log('输出oldCurrentNode', oldCurrentNode.value);
//   if (oldCurrentNode.value) {
//     console.log('输出oldCurrentColor', oldCurrentColor.value);
//     // eslint-disable-next-line no-shadow
//     const oldNode = object.getObjectByName(oldCurrentNode.value);
//     console.log('输出22222', oldNode);
//     initGltf();
//     // oldNode.material.color.set(
//     //   new THREE.Color(oldCurrentColor.value.r, oldCurrentColor.value.g, oldCurrentColor.value.b),
//     // );
//   }
//   oldCurrentNode.value = item.name;
//   map.render();
// };
onUnmounted(() => {
  map?.destroy();
});
</script>

<template>
  <div id="container" ref="container"></div>
  <div style="position: absolute; top: 10px; width: 300px; cursor: pointer">
    <ul>
      <li v-for="(item, index) in nodesList" :key="index" @click="goNode(item)">{{ item.name }}</li>
    </ul>
  </div>
</template>

<style scoped>
#container {
  width: 100%;
  height: 100vh;
}
</style>
