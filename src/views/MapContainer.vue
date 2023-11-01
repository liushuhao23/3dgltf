<!-- eslint-disable no-bitwise -->
<!-- eslint-disable no-mixed-operators -->
<!-- eslint-disable max-len -->
<!--
 * @Description: description
 * @Version: 2.0
 * @Autor: liushuhao
 * @Date: 2023-11-01 22:23:26
 * @LastEditors: liushuhao
 * @LastEditTime: 2023-11-01 23:25:43
-->
<script setup>
import { onMounted, onUnmounted } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';

let map = null;

let camera;
let renderer;
let scene;

onMounted(() => {
  AMapLoader.load({
    key: '7d6c80e42046ec2f06899eb4d7f7a352', // 申请好的Web端开发者Key，首次调用 load 时必填
    viewMode: '3D',
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
      console.log('输出map', map);
      // eslint-disable-next-line prefer-destructuring
      const customCoords = map.customCoords;
      console.log('输出customCoords', customCoords);
      // 数据使用转换工具进行转换，这个操作必须要提前执行（在获取镜头参数 函数之前执行），否则将会获得一个错误信息。
      const data = customCoords.lngLatsToCoords([[116.271363, 39.992414]]);
      let object;
      const objPosition = [116.271363, 39.992414];
      const gllayer = new AMap.GLCustomLayer({
        // 图层的层级
        zIndex: 10,
        // 初始化的操作，创建图层过程中执行一次。
        init: (gl) => {
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
            // alpha: true,
            // antialias: true,
            // canvas: gl.canvas,
          });

          // 自动清空画布这里必须设置为 false，否则地图底图将无法显示
          renderer.autoClear = false;
          scene = new THREE.Scene();

          // 环境光照和平行光
          const aLight = new THREE.AmbientLight(0xffffff, 0.3);
          const dLight = new THREE.DirectionalLight(0xffffff, 1);
          dLight.position.set(1000, -100, 900);
          scene.add(dLight);
          scene.add(aLight);
          function setRotation(rotation) {
            const x = (Math.PI / 180) * (rotation.x || 0);
            const y = (Math.PI / 180) * (rotation.y || 0);
            const z = (Math.PI / 180) * (rotation.z || 0);
            object.rotation.set(x, y, z);
          }

          function setPosition(lnglat) {
            // 对模型的经纬度进行转换
            const position = customCoords.lngLatsToCoords([lnglat])[0];
            object.position.setX(position[0]);
            object.position.setY(position[1]);
          }
          function setAngle(angle) {
            const { x } = object.rotation;
            const { z } = object.rotation;
            const y = (Math.PI / 180) * angle;
            object.rotation.set(x, y, z);
          }
          // 改变模型位置和角度
          // const centerPoint = turf.point([116.271363, 39.992414]);
          const timer = 0;
          function startMove() {
            // requestAnimationFrame(function () {
            //     timer += 0.4;
            //     var pos = turf.transformTranslate(centerPoint, 0.3, timer).geometry.coordinates;
            //     var angle = timer;
            //     setPosition(pos);
            //     setAngle(angle);
            //     // 执行地图的渲染
            //     map.render();
            //     startMove();
            // });
          }

          function initGltf() {
            const loader = new GLTFLoader();
            loader.load(
              'https://xland-test6.cbim.org.cn/tianshan/gisconfig/layer/downloadFile/default_accountId_jiuZhou/1717727997668765696/1/main.gltf',
              (gltf) => {
                object = gltf.scene;
                object.scale.set(30, 30, 30);
                // setRotation({
                //   x: 90, y: 0, z: 0,
                // });
                setPosition(objPosition);
                scene.add(object);
                // startMove();
              },
            );
          }

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

          // 2D 地图下使用的正交相机
          // var { near, far, top, bottom, left, right, position, rotation } = customCoords.getCameraParams();

          // 这里的顺序不能颠倒，否则可能会出现绘制卡顿的效果。
          camera.near = near;
          camera.far = far;
          camera.fov = fov;
          camera.position.set(...position);
          camera.up.set(...up);
          camera.lookAt(...lookAt);
          camera.updateProjectionMatrix();

          // 2D 地图使用的正交相机参数赋值
          // camera.top = top;
          // camera.bottom = bottom;
          // camera.left = left;
          // camera.right = right;
          // camera.position.set(...position);
          // camera.updateProjectionMatrix();

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

onUnmounted(() => {
  map?.destroy();
});
</script>

<template>
  <div id="container"></div>
</template>

<style scoped>
#container {
  width: 100%;
  height: 100vh;
}
</style>
JavaScript 提示
