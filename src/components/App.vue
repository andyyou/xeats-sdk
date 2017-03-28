<template>
  <div class="seat">
    <svg 
      id="svgCanvas"
      :viewBox="viewboxString"
      :width="width" 
      :height="height"
      v-pan-zoom="viewBox"
    >
      <g>
        <circle v-for="seat in seats"
          :id="seat.nodeId"
          :cx="seat.x + seat.width / 2"
          :cy="seat.y + seat.height / 2"
          :r="seat.width / 2"
          :fill="seat.fill"
          :stroke="seat.reserved ? '#666' : '#DDD'"
          stroke-width="3"
          @click.stop.prevent="book(seat)"
          @mouseover="showTooltip(seat, $event)"
          @mouseout="tooltip.isActive = false"
        ></circle>
      </g>
    </svg>
    <span v-if="tooltip.isActive" :style="tooltip.styleObject" >{{ tooltip.content }}</span>
    <div class="manipulate">
      <svg @click="zoom('in')" width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <title>zoomIn</title>
        <defs>
          <rect id="path-1" x="0" y="0" width="24" height="24" rx="3"></rect>
          <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="24" height="24" fill="white">
            <use xlink:href="#path-1"></use>
          </mask>
        </defs>
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="zoomIn">
            <use id="Rectangle" stroke="#6F6F6F" mask="url(#mask-2)" stroke-width="4" fill="#FFFFFF" xlink:href="#path-1"></use>
            <polygon id="plus" fill="#6F6F6F" points="17.6914286 10.6971429 13.5771429 10.6971429 13.5771429 6.58285714 10.8342857 6.58285714 10.8342857 10.6971429 6.72 10.6971429 6.72 13.44 10.8342857 13.44 10.8342857 17.5542857 13.5771429 17.5542857 13.5771429 13.44 17.6914286 13.44"></polygon>
          </g>
        </g>
      </svg>

      <svg @click="reset()" width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <title>zoomReset</title>
        <defs>
          <rect id="path-1" x="0" y="0" width="24" height="24" rx="3"></rect>
          <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="24" height="24" fill="white">
            <use xlink:href="#path-1"></use>
          </mask>
        </defs>
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="zoomReset">
            <use id="Rectangle" stroke="#6F6F6F" mask="url(#mask-2)" stroke-width="4" fill="#FFFFFF" xlink:href="#path-1"></use>
            <path d="M16.4571429,13.0957834 L16.4571429,17.1428571 L13.7142857,17.1428571 L13.7142857,14.4954037 L10.9714286,14.4954037 L10.9714286,17.1428571 L8.22857143,17.1428571 L8.22857143,13.0957834 L12.3428571,9.40037963 C14.4,11.2480815 16.4571429,13.0957834 16.4571429,13.0957834 Z M12.342143,6.70227051 L6.53930664,11.8363037 L7.57922362,13.0478516 L12.342143,8.77252198 L17.0311894,13.0478517 L18.2575077,11.8363038 C18.2575077,11.8363038 13.0411037,7.36431194 12.342143,6.70227051 Z" id="home" fill="#6F6F6F"></path>
          </g>
        </g>
      </svg>

      <svg @click="zoom('out')" width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <title>zoomOut</title>
        <defs>
          <rect id="path-1" x="0" y="0" width="24" height="24" rx="3"></rect>
          <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="24" height="24" fill="white">
            <use xlink:href="#path-1"></use>
          </mask>
        </defs>
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="zoomOut">
            <use id="Rectangle" stroke="#6F6F6F" mask="url(#mask-2)" stroke-width="4" fill="#FFFFFF" xlink:href="#path-1"></use>
            <polygon id="minus" fill="#6F6F6F" points="6.44571429 10.6971429 18.24 10.6971429 18.24 13.44 6.44571429 13.44"></polygon>
          </g>
        </g>
      </svg>

    </div>
  </div>
</template>

<script>
const SEATS = [
  {
    "id": 0,
    "nodeId": "_x31_-6",
    "x": 665.5,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 1,
    "nodeId": "_x31_-4",
    "x": 751.8,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 2,
    "nodeId": "_x31_-2",
    "x": 838.1,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 3,
    "nodeId": "_x31_-1",
    "x": 924.4,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 4,
    "nodeId": "_x31_-3",
    "x": 1010.6,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 5,
    "nodeId": "_x31_-5",
    "x": 1096.9,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 6,
    "nodeId": "_x31_-7",
    "x": 1183.2,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 7,
    "nodeId": "_x33_-6",
    "x": 665.5,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 8,
    "nodeId": "_x33_-4",
    "x": 751.8,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 9,
    "nodeId": "_x33_-2",
    "x": 838.1,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 10,
    "nodeId": "_x33_-1_1_",
    "x": 924.4,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 11,
    "nodeId": "_x33_-3",
    "x": 1010.6,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 12,
    "nodeId": "_x33_-5",
    "x": 1096.9,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 13,
    "nodeId": "_x33_-7",
    "x": 1183.2,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 14,
    "nodeId": "_x32_-8",
    "x": 628.3,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 15,
    "nodeId": "_x32_-6",
    "x": 714.6,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 16,
    "nodeId": "_x32_-4",
    "x": 800.8,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 17,
    "nodeId": "_x32_-2",
    "x": 887.1,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 18,
    "nodeId": "_x32_-1",
    "x": 973.4,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 19,
    "nodeId": "_x32_-3",
    "x": 1059.7,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 20,
    "nodeId": "_x32_-5",
    "x": 1145.9,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 21,
    "nodeId": "_x32_-7",
    "x": 1232.2,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 22,
    "nodeId": "_x31_-13",
    "x": 1520.5,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 23,
    "nodeId": "_x31_-15",
    "x": 1606.7,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 24,
    "nodeId": "_x33_-9",
    "x": 1347.9,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 25,
    "nodeId": "_x33_-11",
    "x": 1434.2,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 26,
    "nodeId": "_x33_-13",
    "x": 1520.5,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 27,
    "nodeId": "_x33_-15",
    "x": 1606.7,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 28,
    "nodeId": "_x33_-17",
    "x": 1693,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 29,
    "nodeId": "_x32_-9",
    "x": 1391,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 30,
    "nodeId": "_x32_-11",
    "x": 1477.3,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 31,
    "nodeId": "_x32_-13",
    "x": 1563.6,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 32,
    "nodeId": "_x32_-15",
    "x": 1649.9,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 33,
    "nodeId": "_x34_-9",
    "x": 1347.9,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 34,
    "nodeId": "_x34_-11",
    "x": 1434.2,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 35,
    "nodeId": "_x34_-13",
    "x": 1520.5,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 36,
    "nodeId": "_x34_-15",
    "x": 1606.7,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 37,
    "nodeId": "_x36_-9",
    "x": 1347.9,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 38,
    "nodeId": "_x36_-11",
    "x": 1434.2,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 39,
    "nodeId": "_x36_-13",
    "x": 1520.5,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 40,
    "nodeId": "_x36_-15",
    "x": 1606.7,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 41,
    "nodeId": "_x36_-17",
    "x": 1693,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 42,
    "nodeId": "_x37_-9",
    "x": 1391,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 43,
    "nodeId": "_x37_-11",
    "x": 1477.3,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 44,
    "nodeId": "_x37_-13_x28_工作席_x29_",
    "x": 1563.6,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 45,
    "nodeId": "_x37_-15_x28_工作席_x29_",
    "x": 1649.9,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 46,
    "nodeId": "_x37_-17_x28_工作席_x29_",
    "x": 1736.1,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 47,
    "nodeId": "_x35_-9",
    "x": 1391,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 48,
    "nodeId": "_x35_-11",
    "x": 1477.3,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 49,
    "nodeId": "_x35_-13",
    "x": 1563.6,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 50,
    "nodeId": "_x35_-15",
    "x": 1649.9,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 51,
    "nodeId": "_x31_-9",
    "x": 1347.9,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 52,
    "nodeId": "_x31_-11",
    "x": 1434.2,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 53,
    "nodeId": "_x31_-8",
    "x": 502.8,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 54,
    "nodeId": "_x31_-10",
    "x": 416.5,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 55,
    "nodeId": "_x31_-12",
    "x": 330.3,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 56,
    "nodeId": "_x31_-14",
    "x": 244,
    "y": 115.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 57,
    "nodeId": "_x33_-8",
    "x": 502.8,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 58,
    "nodeId": "_x33_-10",
    "x": 416.5,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 59,
    "nodeId": "_x33_-12",
    "x": 330.3,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 60,
    "nodeId": "_x33_-14",
    "x": 244,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 61,
    "nodeId": "_x33_-16",
    "x": 157.7,
    "y": 311.8,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 62,
    "nodeId": "_x32_-10",
    "x": 459.7,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 63,
    "nodeId": "_x32_-12",
    "x": 373.4,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 64,
    "nodeId": "_x32_-14",
    "x": 287.1,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 65,
    "nodeId": "_x32_-16",
    "x": 200.8,
    "y": 213.7,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 66,
    "nodeId": "_x34_-8",
    "x": 502.8,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 67,
    "nodeId": "_x34_-10",
    "x": 416.5,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 68,
    "nodeId": "_x34_-12",
    "x": 330.3,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 69,
    "nodeId": "_x34_-14",
    "x": 244,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 70,
    "nodeId": "_x36_-8",
    "x": 502.8,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 71,
    "nodeId": "_x36_-10",
    "x": 416.5,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 72,
    "nodeId": "_x36_-12",
    "x": 330.3,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 73,
    "nodeId": "_x36_-14",
    "x": 244,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 74,
    "nodeId": "_x36_-16",
    "x": 157.7,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 75,
    "nodeId": "_x37_-10",
    "x": 459.7,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 76,
    "nodeId": "_x37_-12",
    "x": 373.4,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 77,
    "nodeId": "_x37_-14_x28_工作席_x29_",
    "x": 287.1,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 78,
    "nodeId": "_x37_-16_x28_工作席_x29_",
    "x": 200.8,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 79,
    "nodeId": "_x37_-18_x28_工作席_x29_",
    "x": 114.6,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 80,
    "nodeId": "_x35_-10",
    "x": 459.7,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 81,
    "nodeId": "_x35_-12",
    "x": 373.4,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 82,
    "nodeId": "_x35_-14",
    "x": 287.1,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 83,
    "nodeId": "_x35_-16",
    "x": 200.8,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 84,
    "nodeId": "_x34_-6",
    "x": 665.5,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 85,
    "nodeId": "_x34_-4",
    "x": 751.8,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 86,
    "nodeId": "_x34_-2",
    "x": 838.1,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 87,
    "nodeId": "_x34_-1",
    "x": 924.4,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 88,
    "nodeId": "_x34_-3",
    "x": 1010.6,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 89,
    "nodeId": "_x34_-5_x28_工作席_x29_",
    "x": 1096.9,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 90,
    "nodeId": "_x34_-7_x28_工作席_x29_",
    "x": 1183.2,
    "y": 484.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 91,
    "nodeId": "_x36_-6",
    "x": 665.5,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 92,
    "nodeId": "_x36_-4",
    "x": 751.8,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 93,
    "nodeId": "_x36_-2",
    "x": 838.1,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 94,
    "nodeId": "_x36_-1",
    "x": 924.4,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 95,
    "nodeId": "_x36_-3",
    "x": 1010.6,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 96,
    "nodeId": "_x36_-5",
    "x": 1096.9,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 97,
    "nodeId": "_x36_-7",
    "x": 1183.2,
    "y": 684.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 98,
    "nodeId": "_x35_-8",
    "x": 628.3,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 99,
    "nodeId": "_x35_-6",
    "x": 714.6,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 100,
    "nodeId": "_x35_-4",
    "x": 800.8,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 101,
    "nodeId": "_x35_-2",
    "x": 887.1,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 102,
    "nodeId": "_x35_-1",
    "x": 973.4,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 103,
    "nodeId": "_x35_-3",
    "x": 1059.7,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 104,
    "nodeId": "_x35_-5",
    "x": 1145.9,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 105,
    "nodeId": "_x35_-7",
    "x": 1232.2,
    "y": 584.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 106,
    "nodeId": "_x37_-8",
    "x": 628.3,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 107,
    "nodeId": "_x37_-6",
    "x": 714.6,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 108,
    "nodeId": "_x37_-4",
    "x": 800.8,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 109,
    "nodeId": "_x37_-2",
    "x": 887.1,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 110,
    "nodeId": "_x37_-1",
    "x": 973.4,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 111,
    "nodeId": "_x37_-3",
    "x": 1059.7,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 112,
    "nodeId": "_x37_-5",
    "x": 1145.9,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  },
  {
    "id": 113,
    "nodeId": "_x37_-7",
    "x": 1232.2,
    "y": 784.3,
    "width": "74.5",
    "height": "74.5"
  }
]
export default {
  props: {
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    spot: {
      type: String
    },
    zoomMax: {
      type: Number
    },
    zoomMin: {
      type: Number
    },
    token: {
      type: String
    },
    autoSize: {
      type: Boolean
    },
    amountMax: {
      type: Number
    },
    amountMin: {
      type: Number
    }
  },
  data () {
    return {
      viewport: {
        width: this.width,
        height: this.height
      },
      // FIXME: Original SVG size from API
      svg: {
        width: 1913.7,
        height: 937.3
      },
      /**
       * Use v-pan-zoom required this
       */
      viewBox: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zoomMax: this.zoomMax,
        zoomMin: this.zoomMin,
        scale: 1
      },
      seats: [],
      amount: 0,
      tooltip:{
        content: "",
        isActive: false,
        styleObject: {
          color: '#FFF',
          border: '1px solid #333',
          'border-radius': '3px',
          padding: '3px 6px',
          background: '#333',
          position: 'absolute',
          left: '0',
          top: '0',
          'white-space': 'nowrap'
        }
      }
    }
  },
  computed: {
    viewboxString () {
      const minX = this.viewBox.x || 0 - this.viewBox.x
      const minY = this.viewBox.y || 0 - this.viewBox.y
      const width = this.viewBox.width
      const height = this.viewBox.height

      return `${minX} ${minY} ${width} ${height}`
    }
  },
  created () {
    this.seats = SEATS
  },
  mounted () {
    let ratio
    if (this.autoSize) {
      this.viewport.width = this.$el.getBoundingClientRect().width
      ratio = this.viewport.width / this.svg.width
      // this.viewport.height = this.svg.height * ratio
      this.viewport.height = this.$el.getBoundingClientRect().height
    } else {
      ratio = 1
    }

    this.viewBox.width = this.viewport.width
    this.viewBox.height = this.viewport.height
    this.seats = this.seats.map(function (seat) {
      return Object.assign({}, seat, {
        x: seat.x * ratio,
        y: seat.y * ratio,
        width: seat.width * ratio,
        height: seat.height * ratio,
        fill: '#DDD',
        reserved: false
      })
    })
  },
  methods: {
    book (seat) {
      console.log('Reserved', seat)

      if (!seat.reserved) {
        if (this.amount + 1 <= this.amountMax) {
          seat.reserved = !seat.reserved
          this.amount++
        }
      } else {
        seat.reserved = !seat.reserved
        this.amount--
      }

      if (seat.reserved) {
        seat.fill = 'red'
      } else {
        seat.fill = '#DDD'
      }
    },
    showTooltip (seat, event){
      this.tooltip.isActive = true
      this.tooltip.content = seat.nodeId

      //  取得圓心的 SVG 座標
      let svgCanvas = document.getElementById('svgCanvas')
      let svgPoint = svgCanvas.createSVGPoint()
      let ctm = svgCanvas.getScreenCTM()
      svgPoint.x = event.target.getAttribute('cx')
      svgPoint.y = event.target.getAttribute('cy')

      //  轉成 viewport 的 client 座標
      let viewportPoint = svgPoint.matrixTransform(ctm)

      //  轉換成 viewport 的 offset 座標並代入 CSS
      this.tooltip.styleObject.left = (viewportPoint.x - svgCanvas.getBoundingClientRect().left + 10) + "px"
      this.tooltip.styleObject.top = (viewportPoint.y - svgCanvas.getBoundingClientRect().top + 10) + "px"

    },
    reset () {
      this.viewBox.x = 0
      this.viewBox.y = 0
      this.viewBox.width = this.viewport.width
      this.viewBox.height = this.viewport.height
      this.viewBox.scale = 1
    },
    zoom (effect) {
      let svgCanvas = document.getElementById('svgCanvas')
      let svgPoint = svgCanvas.createSVGPoint()
      let viewport = svgCanvas.getBoundingClientRect()
     
      //  設定縮放倍率，且不能超過 zoomMax 和 zoomMin
      let scale = this.viewBox.scale
      if (effect === 'out') {
        scale += 0.1
        if (scale >= this.viewBox.zoomMax) {scale = this.viewBox.zoomMax}     //  縮小
      } else if(effect === 'in') {
        scale -= 0.1
        if (scale <= this.viewBox.zoomMin) {scale = this.viewBox.zoomMin}     //  放大
      }

      //  取得目前螢幕中心點
      let viewportCenterPoint = {
        x: viewport.width / 2 + viewport.left,
        y: viewport.height / 2 + viewport.top
      }
      svgPoint.x = viewportCenterPoint.x
      svgPoint.y = viewportCenterPoint.y
      let startSvgCenterPoint = svgPoint.matrixTransform(svgCanvas.getScreenCTM().inverse())

      //  進行縮放
      this.viewBox.width = viewport.width * scale
      this.viewBox.height = viewport.height * scale
      svgCanvas.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${viewport.width * scale} ${viewport.height * scale}`)

      //  位移回中心點
      let viewBox = svgCanvas.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
      let endSvgCenterPoint = svgPoint.matrixTransform(svgCanvas.getScreenCTM().inverse())
      this.viewBox.x = viewBox[0] + (startSvgCenterPoint.x - endSvgCenterPoint.x)
      this.viewBox.y = viewBox[1] + (startSvgCenterPoint.y - endSvgCenterPoint.y)
      this.viewBox.scale = scale
    }
  }
}
</script>

<style lang="sass" scoped>
  .seat{
    position: relative;
  }
  .manipulate{
    position: absolute;
    bottom: 60px;
    left: 40px;
    cursor: pointer;

    svg{
      width: 32px;
      height: 32px;
    }
  }
</style>