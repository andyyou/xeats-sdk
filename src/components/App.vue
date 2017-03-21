<template>
  <div>
    
    <svg :viewBox="viewboxString"
      :width="width" 
      :height="height" 
      v-pan-zoom="viewBox"
    >
      <g>
        <rect v-for="seat in seats"
          :id="seat.nodeId" 
          :x="seat.x" :y="seat.y" 
          :fill="seat.fill" 
          :width="seat.width" 
          :height="seat.height"
          @click.stop.prevent="book(seat)"
        ></rect>
      </g>
    </svg>
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
      // FIXME: Original SVG size from API
      viewport: {
        width: 1913.7,
        height: 937.3
      },
      svg: {
        width: this.width,
        height: this.height
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
        zoomMin: this.zoomMin
      },
      seats: [],
      amount: 0
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
      this.svg.width = this.$el.getBoundingClientRect().width
      ratio = this.svg.width / this.viewport.width
      this.svg.height = this.viewport.height * ratio
    } else {
      ratio = 1
    }

    this.viewBox.width = this.svg.width
    this.viewBox.height = this.svg.height
    this.seats = this.seats.map(function (seat) {
      return Object.assign({}, seat, {
        x: seat.x * ratio,
        y: seat.y * ratio,
        width: seat.width * ratio,
        height: seat.height * ratio,
        fill: '#E8403D',
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
        seat.fill = 'aqua'
      } else {
        seat.fill = '#E8403D'
      }
    }
  }
}
</script>

<style lang="sass" scoped>

</style>