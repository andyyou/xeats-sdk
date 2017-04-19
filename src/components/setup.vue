<script>
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
      tooltip:{
        content: "",
        active: false,
        left: 0,
        top: 0,
        timer: null
      },
      /* `pan-zoom`, `picking` mode is the directive name */
      mode: 'pan-zoom',
      picking: {
        begin: {
          x: 0,
          y: 0
        },
        moveTo: {
          x: 0,
          y: 0
        },
        elements: []
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
      this.seats = this.seats.map(function (seat) {
        return Object.assign({}, seat, {
          x: seat.x * ratio,
          y: seat.y * ratio,
          width: seat.width * ratio,
          height: seat.height * ratio,
          fill: '#d3d3d3',
          reserved: false
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
          seat.reserved = true
          this.amount++
        }
      } else {
        seat.reserved = false
        this.amount--
      }

      if (seat.reserved) {
        seat.fill = '#90CA77'
      } else {
        seat.fill = '#d3d3d3'
      }
    },
    getToken () {
      return this.$parent.getToken.call(this)
    },
    setToken () {
      return this.$parent.setToken.call(this)
    },
    showTooltip (seat){
      this.tooltip.active = true
      this.tooltip.content = seat.label

      let svgCanvas = document.getElementById('svg-canvas')
      let point = svgCanvas.createSVGPoint()
      point.x = seat.x
      point.y = seat.y

      // Update point base on current transform matrix
      point = point.matrixTransform(svgCanvas.getScreenCTM())

      // Offset point base svg translate x,y
      this.tooltip.left = point.x
      this.tooltip.top = point.y + (seat.height + 5) / this.viewBox.scale
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
  render (createElement) {
    let vm = this

    let expressions = {
      'pan-zoom': 'viewBox',
      'picking': 'picking'
    }

    let directive = {
      /* mode is directive name */
      name: vm.mode, 
      expression: expressions[vm.mode]
    }

    return createElement('div', {
      attrs: {
        class: 'container'
      }
    }, [
      createElement('svg', {
        attrs: {
          id: 'svg-canvas',
          viewBox: vm.viewboxString,
          
        },
        style: vm.styles.edge,
        directives: [
          directive
        ]
      }, [
        createElement('g', null, vm.seats.map(function (seat) {
          return createElement('rect', {
            attrs: {
              x: seat.x,
              y: seat.y,
              width: seat.width,
              height: seat.height,
              fill: seat.fill,
              class: 'seat'
            },
            on: {
              click: function (e) {
                e.preventDefault()
                e.stopPropagation()
                return vm.book(seat)
              },
              touchend: function () {
                return vm.book(seat)
              },
              mousedown: function (e) {
                e.preventDefault()
                e.stopPropagation()
                vm.tooltip.active = false
                
              },
              mouseover: function (e) {
                e.preventDefault()
                e.stopPropagation()
                vm.tooltip.timer = setTimeout(function () {
                  return vm.showTooltip(seat)
                }, 300)
              },
              mouseout: function (e) {
                e.preventDefault()
                clearTimeout(vm.tooltip.timer)
                vm.tooltip.active = false
              }
            }
          })
        }))
      ]),
      createElement('span', {
        style: vm.styles.tooltip,
        attrs: {
          class: 'tooltip'
        },
        directives: [
          {
            name: 'show',
            expression: 'tooltip.active',
            value: vm.tooltip.active
          }
        ]
      }, vm.tooltip.content),
      createElement('div', {
        attrs: {
          class: 'manipulate'
        }
      }, [
        createElement('button', {
          class: {
            active: vm.mode === 'pan-zoom'
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = 'pan-zoom'
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-arrows'
            }
          })
        ]),
        createElement('button', {
          class: {
            active: vm.mode === 'picking'
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = 'picking'
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-object-group'
            }
          })
        ]),
        createElement('button', {
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.zoom('in')
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-plus'
            }
          })
        ]),
        createElement('button', {
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.zoom('out')
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-minus'
            }
          })
        ]),
        createElement('button', {
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.reset()
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-refresh'
            }
          })
        ])
      ])
    ])
  }
}
</script>

<style lang="sass" scoped>
  svg {
    transation: all .3s ease;
    background-color: transparent;
  }

  .container {
    padding: 15px;
    position: relative;
    border: 1px solid #EEE;
    background-size: 20px 20px;
    background-color: white;
    background-image: linear-gradient(to right, #EEE 1px, transparent 1px), linear-gradient(to bottom, #EEE 1px, transparent 1px);
  }

  .seat {
    cursor: pointer;
  }

  .manipulate {
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    position: absolute;
    z-index: 10;
    top: 30px;
    left: 30px;
    cursor: pointer;
    border: 1px solid #CCC;
    background-color: white;
    box-shadow: 0 1px 2px #DDD;
    padding: 5px 0;

    button {
      float: left;
      padding: 5px 8px;
      background-color: transparent;
      border: none;
      border-right: 1px solid #CCC;
      text-align: center;
      vertical-align: middle;
      font-size: 14px;
      cursor: pointer;
      color: #A1A1A1;

      &:hover {
        color: black;
      }

      &:last-child {
        border-right: none;
      }

      &.active {
        color: black;
      }
    }
  }

  .tooltip {
    color: #FFF;
    border: 1px solid #333;
    border-radius: 3px;
    padding: 3px 6px;
    background: #333;
    position: absolute;
    left: 0;
    top: 0;
    white-space: nowrap;
  }

  .ghost {
    background-color: rgba(0, 0, 0, .2);
    border: 1px solid white;
    position: absolute;
  }

  .ghost-active {
    display: block !important;
  }

  .ghost-pick {
    display: none;
    z-index: 9;
    position: absolute !important;
    cursor: default !important;

    > span {
      background-color: rgba(0, 0, 0, .2);
      border: 1px solid white;
      width: 100%;
      height: 100%;
      float: left;
    }
  }

  .test {
    display: block;
    position: absolute;
    border: 1px dotted blue;
  }

</style>