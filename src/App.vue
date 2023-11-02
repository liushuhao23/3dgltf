<!--
 * @Description: description
 * @Version: 2.0
 * @Autor: liushuhao
 * @Date: 2023-11-02 09:09:56
 * @LastEditors: liushuhao
 * @LastEditTime: 2023-11-02 14:22:50
-->
<template>
  <MapContainer></MapContainer>
  <!-- <MapContainerCopy></MapContainerCopy> -->
</template>
<script lang="ts" setup>
import MapContainer from './views/MapContainer.vue';
import MapContainerCopy from './views/MapContainerCopy.vue';

</script>

<style lang="less" >

#app {
  // font-family: Avenir, Helvetica, Arial, sans-serif;
  // -webkit-font-smoothing: antialiased;
  // -moz-osx-font-smoothing: grayscale;
  // // text-align: center;
  // color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
