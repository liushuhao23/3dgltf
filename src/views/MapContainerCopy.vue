<!--
 * @Description: description
 * @Version: 2.0
 * @Autor: liushuhao
 * @Date: 2023-11-02 14:08:49
 * @LastEditors: liushuhao
 * @LastEditTime: 2023-11-02 14:16:37
-->
<template>
  <div id="container" ref="container"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import AMapLoader from '@amap/amap-jsapi-loader';
// 其他可能需要的 Three.js 的依赖...

const container: any = ref(null);

onMounted(async () => {
  // 初始化高德地图
  const AMap = await AMapLoader.load({
    key: '7d6c80e42046ec2f06899eb4d7f7a352', // 申请好的Web端开发者Key，首次调用 load 时必填
    version: '2.0',
    plugins: [], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
  });
  const map = new AMap.Map('container', {
    zoom: 15,
    center: [116.39, 39.9],
  });

  // 初始化Three.js渲染器、摄像机、场景等
  const renderer = new THREE.WebGLRenderer();
  const scene = new THREE.Scene();
  // eslint-disable-next-line max-len
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  nextTick(() => {
    console.log('输出container', container.value);
    container.value!.appendChild(renderer.domElement);
  });

  // 加载 glTF 模型
  const loader = new GLTFLoader();
  let selectedObject: THREE.Object3D | null = null;
  const url = 'https://xland-test6.cbim.org.cn/tianshan/gisconfig/layer/downloadFile/default_accountId_jiuZhou/1717727997668765696/1/main.gltf';

  loader.load(url, (gltf: { scene: { children: any } }) => {
    scene.add(gltf.scene);

    // 添加点击事件处理
    container.value.addEventListener('click', (event: { clientX: number; clientY: number }) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(gltf.scene.children, true);
      if (intersects.length > 0) {
        if (selectedObject) {
          // 还原之前选中的对象的颜色
          (selectedObject.material as THREE.Material).color.set(0xffffff);
        }
        selectedObject = intersects[0].object;
        // 设置选中对象的颜色
        (selectedObject.material as THREE.Material).color.set(0xff0000);
      }
    });
  });

  // 更新渲染循环
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
});
</script>

<style scoped>
#container {
  width: 100vw;
  height: 100vh;
}
</style>
