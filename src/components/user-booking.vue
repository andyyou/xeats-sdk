<script>
// cSpell:ignore viewbox rect
import _ from 'lodash'

function darken(color, percent) {
  let f = parseInt(color.slice(1),16),
      t = (percent < 0) ? 0:255,
      p = (percent < 0) ? percent * -1 : percent,
      R = f>>16,
      G = f>>8 & 0x00FF,
      B = f & 0x0000FF

  return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

export default {
  props: {
    width: {
      type: [String, Number],
      required: true
    },
    height: {
      type: [String, Number],
      required: true
    },
    sourceId: {
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
    amountMax: {
      type: Number
    },
    amountMin: {
      type: Number
    },
    categories: {
      type: Array
    }
  },
  data () {
    return {
      viewport: {
        width: this.width,
        height: this.height
      },
      /**
       * Original SVG size from API 
       */
      svg: {
        width: 0,
        height: 0
      },
      /**
       * Use v-pan-zoom required this
       * For svg's viewBox attrs
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
      /**
       * svg objects will divide 4 types
       */
      seats: [],
      stages: [],
      facilities: [],
      disabilities: [],
      /**
       * Booking amount for limitation
       */
      amount: 0,
      tooltip: {
        content: "",
        active: false,
        left: 0,
        top: 0,
        timer: null
      },
      /**
       * `pan-zoom` mode is the directive name 
       */
      mode: 'pan-zoom',
      /**
       * Status for loader
       */
      loading: true,
      failed: null
    }
  },
  computed: {
    viewboxString () {
      // TODO: remove `0 - this.viewBox.x`
      const minX = this.viewBox.x || 0 - this.viewBox.x
      const minY = this.viewBox.y || 0 - this.viewBox.y
      const width = this.viewBox.width
      const height = this.viewBox.height

      return `${minX} ${minY} ${width} ${height}`
    },
    styles () {
      return {
        edge: {
          width: isNaN(+this.width) ? '100%' : `${this.width}px`,
          height: isNaN(+this.height) ? '100%' : `${this.height}px`
        },
        tooltip: {
          left: `${this.tooltip.left}px`,
          top: `${this.tooltip.top}px`
        }
      }
    }
  },
  created () {
    let vm = this

    vm.$http.get(`/spots/${vm.sourceId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('_x_t')}`
      }
    })
    .then(res => {
      vm.seats = res.data.objects.filter(obj => obj.type === 'seat')
      vm.stages = res.data.objects.filter(obj => obj.type === 'stage')
      vm.facilities = res.data.objects.filter(obj => obj.type === 'facilities')
      vm.disabilities = res.data.objects.filter(obj => obj.type === 'disabilities')
      
      vm.svg.width = res.data.svg.width
      vm.svg.height = res.data.svg.height

      // For calculate responsive of viewport
      let ratio

      // Base on longer axis to calculate for responsive.
      if (isNaN(+vm.viewport.width)) {
        vm.viewport.width = Math.floor(vm.$el.getBoundingClientRect().width)
      }

      if (isNaN(+vm.viewport.height)) {
        vm.viewport.height = Math.floor(vm.$el.getBoundingClientRect().height)
      }

      if (res.data.svg.width > res.data.svg.height) {
        ratio = vm.viewport.width / vm.svg.width
      } else {
        ratio = vm.viewport.height / vm.svg.height
      }

      // 這裡是接從 API 過來的資料
      let colors = {
        seat: '#d3d3d3'   // res.data.o
      }

      vm.viewport.width = Math.floor(vm.svg.width * ratio)
      vm.viewport.height = Math.floor(vm.svg.height * ratio)
      vm.viewBox.width = vm.viewport.width
      vm.viewBox.height = vm.viewport.height
      vm.seats = vm.seats.map( seat => {
        return Object.assign({}, seat, {
          x: seat.x * ratio,
          y: seat.y * ratio,
          width: seat.width * ratio,
          height: seat.height * ratio,
          fill: colors.seat,    // TODO: 這裡要代入 API 的資料
          reserved: false,
        })
      })

      vm.$nextTick(() => {
        vm.loading = false
      })
    })
    .catch( error => {
      vm.failed = 'API request failed, Try to reload please.'
      console.log('error', error)
    })
  },
  methods: {
    getToken () {
      return this.$parent.getToken.call(this)
    },
    setToken () {
      return this.$parent.setToken.call(this)
    },
    showTooltip (seat) {
      this.tooltip.active = true
      this.tooltip.content = seat.label
      
      let svgCanvas = document.getElementById('svg-canvas')
      let point = svgCanvas.createSVGPoint()
      point.x = seat.x
      point.y = seat.y

      // Update point base on current transform matrix
      point = point.matrixTransform(svgCanvas.getScreenCTM())

      // Offset point base svg translate x, y
      this.tooltip.left = point.x - svgCanvas.parentElement.getBoundingClientRect().left
      this.tooltip.top = (point.y + (seat.height + 5) / this.viewBox.scale) - svgCanvas.parentElement.getBoundingClientRect().top
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
      let point = svgCanvas.createSVGPoint()
      // Viewport is equal to width & height of svg el.
      let viewport = svgCanvas.getBoundingClientRect()
    
      // Setup ratio & never grater than zoomMax nor smaller than zoomMin.
      let scale = this.viewBox.scale
      if (effect === 'out') {
        scale += 0.1
        if (scale >= this.viewBox.zoomMax) {
          scale = this.viewBox.zoomMax
        }
      } else if(effect === 'in') {
        scale -= 0.1
        if (scale <= this.viewBox.zoomMin) {
          scale = this.viewBox.zoomMin
        }
      }
      /**
       * Because svg will be transform so need to get point reference to browser.
       * Get center point of browser viewport
       */
      point.x = viewport.width / 2 + viewport.left
      point.y = viewport.height / 2 + viewport.top
    
      let startSvgCenterPoint = point.matrixTransform(svgCanvas.getScreenCTM().inverse())

      // process scale directly
      this.viewBox.width = viewport.width * scale
      this.viewBox.height = viewport.height * scale
      svgCanvas.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`)

      let viewBox = svgCanvas.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
      let endSvgCenterPoint = point.matrixTransform(svgCanvas.getScreenCTM().inverse())
      
      this.viewBox.x = viewBox[0] + startSvgCenterPoint.x - endSvgCenterPoint.x
      this.viewBox.y = viewBox[1] + startSvgCenterPoint.y - endSvgCenterPoint.y
      this.viewBox.scale = scale
      svgCanvas.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${viewport.width * scale} ${viewport.height * scale}`)
    },
    book (seat) {
      if (!seat.reserved) {
        if (this.amount + 1 <= this.amountMax) {
          seat.reserved = !seat.reserved
          seat.fill = darken(seat.fill, -0.2)
          this.amount++
        }
      } else {
        seat.reserved = !seat.reserved
        seat.fill = colors.seat
        this.amount--
      }
    }
  },
}

</script>

<style>
</style>