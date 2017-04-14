<template>
  <div class="seat"
  :style="{width: viewport.width + 'px', height: viewport.height + 'px'}"
  >
    <svg 
      id="svg-canvas"
      :viewBox="viewboxString"
      :width="viewport.width" 
      :height="viewport.height"
      v-pan-zoom="viewBox"
    >
      <g>
        <!--<circle v-for="seat in seats"
          :id="seat.node_id"
          :cx="seat.x + seat.width / 2"
          :cy="seat.y + seat.height / 2"
          :r="seat.width / 2"
          :fill="seat.fill"
          :stroke="seat.reserved ? '#333' : '#333'"
          stroke-width="2"
          @click.stop.prevent="book(seat)"
          @mouseover="showTooltip(seat, $event)"
          @mouseout="tooltip.isActive = false"
        ></circle>-->
        <rect v-for="seat in seats"
        :id="seat.node_id"
        :x="seat.x"
        :y="seat.y"
        :width="seat.width"
        :height="seat.height"
        :fill="seat.fill"
        :stroke="seat.reserved ? '#333' : '#333'"
        stroke-width="2"
        @touchend.stop.prevent="book(seat)"
        @click.stop.prevent="book(seat)"
        @mouseover="showTooltip(seat, $event)"
        @mouseout="tooltip.isActive = false"
        >
        </rect>
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
import axios from 'axios'

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
    //  這裡的 this 指外層(<app></app>)傳進來的值
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
    //  這裡的 this 指的是 component 的 data
    const url = `https://xeats.herokuapp.com/v1.0/spots/${this.spot}`
    axios.get(`https://xeats.herokuapp.com/v1.0/spots/1`)
    .then( res => {
      //  get data from API
      this.seats = res.data.objects
      this.svg.width = res.data.svg.width
      this.svg.height = res.data.svg.height

      // for responsive viewport
      let ratio
      if (this.autoSize) {
        //  判斷哪個是長邊，以此作為 Responsive 計算
        if (res.data.svg.width > res.data.svg.height) {
          //  getBoundingClientRect 會取得 new Xeat 時所設定的 width 和 height
          this.viewport.width = Math.floor(this.$el.getBoundingClientRect().width)
          ratio = this.viewport.width / this.svg.width
          this.viewport.height = Math.floor(this.svg.height * ratio)
        } else {
          this.viewport.height = Math.floor(this.$el.getBoundingClientRect().height)
          ratio = this.viewport.height / this.svg.height
          this.viewport.width = Math.floor(this.svg.width * ratio)
        }
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
          fill: '#90CA77',
          reserved: false
        })
      })
    })
    .catch( error => {
      console.log('error', this.error)
    })
  },
  mounted () {
    
  },
  methods: {
    book (seat) {

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
        seat.fill = 'DarkGreen'
      } else {
        seat.fill = '#90CA77'
      }
    },
    showTooltip (seat, event){
      this.tooltip.isActive = true
      this.tooltip.content = seat.label

      // 取得圓心的 SVG 座標
      let svgCanvas = document.getElementById('svg-canvas')
      let svgPoint = svgCanvas.createSVGPoint()
      let ctm = svgCanvas.getScreenCTM()
      svgPoint.x = event.target.getAttribute('cx')
      svgPoint.y = event.target.getAttribute('cy')

      // 轉成 viewport 的 client 座標
      let viewportPoint = svgPoint.matrixTransform(ctm)

      // 轉換成 viewport 的 offset 座標並代入 CSS
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
      let svgCanvas = document.getElementById('svg-canvas')
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
  svg {
    transation: all .3s ease;
  }

  .seat {
    position: relative;
    border: 1px solid #e3e3e3;
    border-radius: 4px;
    box-shadow: inset 0 1px 1px rgba(0,0,0,0.05);
    text-align: center;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .manipulate {
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    position: absolute;
    top: 60px;
    left: 40px;
    cursor: pointer;

    svg{
      width: 32px;
      height: 32px;
    }
  }
</style>