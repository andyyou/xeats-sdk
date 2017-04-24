

<script>
// cSpell:ignore viewbox rect
import _ from 'lodash'

export default {
  props: {
    width: {
      type: [String, Number]
    },
    height: {
      type: [String, Number]
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
      /* Original SVG size from API */
      svg: {
        width: 0,
        height: 0
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
       stages: [],
       facilities: [],
       disabilities: [],
       amount: 0,
       tooltip: {
         content: "",
         active: false,
         left: 0,
         top: 0,
         timer: null
       },
      // `pan-zoom`, `picking` mode is the directive name
      mode: 'pan-zoom'
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
    this.$http.get(`/spots/${this.sourceId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('_x_t')}`
      }
    })
    .then(res => {
      this.seats = res.data.objects.filter(obj => obj.type === 'seat')
      this.stages = res.data.objects.filter(obj => obj.type === 'stage')
      this.facilities = res.data.objects.filter(obj => obj.type === 'facilities')
      this.disabilities = res.data.objects.filter(obj => obj.type === 'disabilities')
      
      this.svg.width = res.data.svg.width
      this.svg.height = res.data.svg.height

      // For calculate responsive of viewport
      let ratio

      // Base on longer axis to calculate for responsive.
      if (isNaN(+this.viewport.width)) {
        this.viewport.width = Math.floor(this.$el.getBoundingClientRect().width)
      }

      if (isNaN(+this.viewport.height)) {
        this.viewport.height = Math.floor(this.$el.getBoundingClientRect().height)
      }

      if (res.data.svg.width > res.data.svg.height) {
        ratio = this.viewport.width / this.svg.width
      } else {
        ratio = this.viewport.height / this.svg.height
      }

      this.viewport.width = Math.floor(this.svg.width * ratio)
      this.viewport.height = Math.floor(this.svg.height * ratio)
      this.viewBox.width = this.viewport.width
      this.viewBox.height = this.viewport.height
      this.seats = this.seats.map( seat => {
        return Object.assign({}, seat, {
          x: seat.x * ratio,
          y: seat.y * ratio,
          width: seat.width * ratio,
          height: seat.height * ratio,
          fill: '#d3d3d3',    // TODO: 這裡要代入 API 的資料
          reserved: false,
        })
      })
    })
    .catch( error => {
      console.log('error', error)
    })
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
        seat.fill = 'DarkGreen'   // TODO: 變深的色
      } else {
        seat.fill = '#90CA77'     // 從 API 接來的顏色
      }
    },
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
      /** 
       * tooltip absolute position is relative to svg container, 
       * therefore, it need to minus container's clientXY
       */
      this.tooltip.left = point.x - svgCanvas.parentElement.getBoundingClientRect().left
      this.tooltip.top = point.y - svgCanvas.parentElement.getBoundingClientRect().top
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
    }
  },
}

</script>

<style>
</style>