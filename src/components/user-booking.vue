<script>
import _ from 'lodash'

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
    seatsKey: {
      type: String,
      required: true
    },
    accessKey: {
      type: String,
      required: true
    },
    disableZoom: {
      type: Boolean,
      default: false
    },
    zoomMax: {
      type: Number,
      default: 2
    },
    zoomMin: {
      type: Number,
      default: 0.5
    },
    amountMax: {
      type: Number,
      required: true
    },
    amountMin: {
      type: Number,
      required: true
    },
    /**
     * For generate form fields out of iframe
     * Administrator panel no need to use form-post (optional)
     */
    generateFormFields: {
      type: Function
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
        scale: 1,
        initialScale: 1,
        scaleRange: {
          maxScale: 1,         // larger scale means smaller figure
          minScale: 1          // smaller scale means larger figure
        }
      },
      /**
       * svg objects will divide 4 types
       */
      seats: [],
      stages: [],
      facilities: [],
      disabilities: [],
      /**
       * shape for display seats
       */
      shape: '',
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
       * Legend for showing color-ticket pair
       */
      legend: [],
      hoverCategory: '',
      /**
       * Status for loader
       */
      loading: true,
      failed: null
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
    booked () {
      let result = this.seats
        .filter(function (s) {
          return s.picked && 
            s.status === 1 &&
            /^:[\w]+-[\d]+-[\d]+$/.test(s.node_id)
        })
        .map(function (s) {
          // e.g. [`:seat-1-2`, `seat`, `1`, `2`]
          let args = s.node_id.match(/^:([\w]+)-([\d]+)-([\d]+)$/)

          return {
            type: args[1],
            row: args[2],
            column: args[3],
            _id: s._id,
            node_id: s.node_id,
            label: s.label,
            category: s.category,
            info: s.info
          }
        })
      return result
    },
    styles () {
      return {
        edge: {
          width: isNaN(+this.width) ? '100%' : `${this.width}px`,
          height: isNaN(+this.height) ? '100%' : `${this.height}px`,
          maxHeight: '100%'
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

    vm.$http.get(`/seats/${vm.seatsKey}`, {
      headers: {
        'Access-Key': vm.accessKey
      }
    })
    .then(res => {

      const UNAVAILABLE_COLOR = '#d3d3d3'

      vm.seats = res.data.objects.filter(obj => obj.type === 'seat')
      vm.stages = res.data.objects.filter(obj => obj.type === 'stage')
      vm.facilities = res.data.objects.filter(obj => obj.type === 'facilities')
      vm.disabilities = res.data.objects.filter(obj => obj.type === 'disabilities')

      vm.shape = res.data.shape

      vm.svg.width = res.data.svg.width
      vm.svg.height = res.data.svg.height

      // adjust viewport according to user config
      if (isNaN(+vm.viewport.width) === false && vm.viewport.height === 'auto') {
        vm.viewport.height = Math.floor(this.$el.getBoundingClientRect().height)
      }
      
      if (isNaN(+vm.viewport.height) === false && vm.viewport.width === 'auto') {
        if (Math.floor(this.$el.getBoundingClientRect().height < vm.viewport.height)) {
          vm.viewport.height = Math.floor(this.$el.getBoundingClientRect().height)
        }
        vm.viewport.width = Math.floor(this.$el.getBoundingClientRect().width)
      }

      let ratio = Math.min((vm.viewport.width / vm.svg.width), (vm.viewport.height / vm.svg.height))

      // ratio is for viewport, scale is for viewbox
      // larger scale means smaller figure
      vm.viewBox.scale = vm.viewBox.initialScale = ( 1 / ratio )

      vm.viewBox.width = vm.svg.width
      vm.viewBox.height = vm.svg.height

      // calculate the max and min range of scale to zoom
      vm.viewBox.scaleRange.maxScale = (1 / vm.viewBox.zoomMin) * vm.viewBox.initialScale
      vm.viewBox.scaleRange.minScale = (1 / vm.viewBox.zoomMax) * vm.viewBox.initialScale

      vm.seats = vm.seats.map(function (seat) {

        // This is to map Legend
        let legendIndex = vm.legend.findIndex(item => {
          return item.color === seat.fill
        })

        // if not find the color in Legend and not unavailable color then push in legend
        if (legendIndex === -1 && seat.fill !== UNAVAILABLE_COLOR) {
          vm.legend.push({
            name: seat.category,
            color: seat.fill,
          })
        }

        // sort for clarity of legend
        vm.legend.sort((a, b) => {
          if (a.name < b.name) return -1
          if (a.name > b.name) return 1
          return 0
        })


        // SEAT_STATUS: [unavailable, available, reserved, other]
        let colors = [UNAVAILABLE_COLOR, seat.fill, vm.darken(seat.fill, -0.4), UNAVAILABLE_COLOR]
        /**
         * If color show black means something wrong
         */
        return Object.assign({}, seat, {
          fill: colors[seat.status] || 'black',
          picked: false
        })
      })

      vm.loading = false
    })
    .catch( error => {
      vm.failed = 'API request failed, Try to reload please.'
      console.log('error', error)
    })
  },
  methods: {
    showHoverCategory (category) {
      this.hoverCategory = category
    },
    darken (color, percent) {
      let f = parseInt(color.slice(1),16),
      t = (percent < 0) ? 0:255,
      p = (percent < 0) ? percent * -1 : percent,
      R = f>>16,
      G = f>>8 & 0x00FF,
      B = f & 0x0000FF
      return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
    },
    showTooltip (seat) {
      this.tooltip.active = true
      this.tooltip.content = seat.label + '<br>' + (seat.category || '無法購買')
      
      let svgCanvas = this.$el.querySelector('#svg-canvas')
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
      this.viewBox.width = this.svg.width
      this.viewBox.height = this.svg.height
      this.viewBox.scale = this.viewBox.initialScale
    },
    zoom (effect) {
      let svgCanvas = this.$el.querySelector('#svg-canvas')
      let point = svgCanvas.createSVGPoint()
      // Viewport is equal to width & height of svg el.
      let viewport = svgCanvas.getBoundingClientRect()
    
      // Setup ratio & never grater than zoomMax nor smaller than zoomMin.
      let scale = this.viewBox.scale

      if (effect === 'out') {
        scale += 0.1
        if (scale >= this.viewBox.scaleRange.maxScale) {
          scale = this.viewBox.scaleRange.maxScale
        }
      } else if(effect === 'in') {
        scale -= 0.1
        if (scale <= this.viewBox.scaleRange.minScale) {
          scale = this.viewBox.scaleRange.minScale
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
    book (seat, index) {
      if (seat.status !== 1) {
        return
      }
      let vm = this

      if (!seat.picked) {
        if (this.amount + 1 <= this.amountMax) {
          seat.picked = !seat.picked
          seat.cache = seat.fill
          seat.fill = vm.darken(seat.fill, -0.4)
          vm.amount++
          vm.seats.splice(index, 1, seat)
        }
      } else {
        seat.picked = !seat.picked
        seat.fill = seat.cache
        vm.amount--
        vm.seats.splice(index, 1, seat)
      }
      vm.$nextTick(function () {
        vm.generateFormFields(this.booked)
      })
    }
  },
  render (createElement) {
    let vm = this

    return createElement('div', {
      attrs: {
        class: 'container'
      },
      style: vm.styles.edge
    }, [
      vm.booked.map(function (seat) {
        return createElement('input', {
          id: seat._id,
          // TODO: add data-* attributes
          attrs: {
            name: 'xeats[]',
            type: 'hidden'
          },
          domProps: {
            value: seat.node_id
          }
        })
      }),
      /* loader */
      vm.loading ? createElement('div', {
        attrs: {
          class: 'loader'
        }
      }, [
        createElement('div', {
          attrs: {
            class: 'loader-figure'
          },
          style: {
            display: vm.failed ? 'none' : 'block'
          }
        }),
        createElement('p', {
          class: {
            'loader-label': true,
            animate: !vm.failed,
            error: vm.failed
          }
        })
      ]) : null,
      /* /loader */
      
      /* svg */
      createElement('svg', {
        attrs: {
          id: 'svg-canvas',
          viewBox: vm.viewboxString,
        },
        style: vm.styles.edge,
        directives: [
          {
            name: 'pan-zoom',
            expression: 'viewBox',
            modifiers: {
              vframe: true,
              'disable-zoom': vm.disableZoom
            }
          }
        ]
      }, [

        /* seats */
        createElement('g', null, [
          vm.seats.map(function (seat, index) {
            if (vm.shape === 'rect') {
              return createElement(vm.shape, {
                attrs: {
                  stroke: '#444',
                  x: seat.x,
                  y: seat.y,
                  width: seat.width,
                  height: seat.height,
                  fill: seat.fill,
                  'stroke-width': seat.status === 0 || seat.status === 3 ? '0' : '2'
                },
                class: [
                  'seat',
                  {
                    'hover-category': seat.category === vm.hoverCategory
                  },
                  {
                    unavailable: seat.status === 0 || seat.status === 3 ? true : false
                  }
                ],
                on: {
                  click: function (e) {
                    e.preventDefault()
                    e.stopPropagation()
                    vm.book(seat, index)
                  },
                  mousedown: function (e) {
                    vm.tooltip.active = false
                  },
                  mouseover: function (e) {
                    console.log(seat, index)
                    vm.showTooltip(seat)
                  },
                  mouseout: function (e) {
                    vm.tooltip.active = false
                  }
                }
              })
            }

            if (vm.shape === 'circle') {
              return createElement(vm.shape, {
                attrs: {
                  stroke: '#444',
                  cx: seat.x + seat.width / 2,
                  cy: seat.y + seat.height / 2,
                  r: Math.min(seat.width / 2, seat.height / 2),
                  fill: seat.fill,
                  'stroke-width': seat.status === 0 || seat.status === 3 ? '0' : '2'
                },
                class: [
                  'seat',
                  {
                    'hover-category': seat.category === vm.hoverCategory
                  },
                  {
                    unavailable: seat.status === 0 || seat.status === 3 ? true : false
                  }
                ],
                on: {
                  click: function (e) {
                    e.preventDefault()
                    e.stopPropagation()
                    vm.book(seat, index)
                  },
                  mousedown: function (e) {
                    vm.tooltip.active = false
                  },
                  mouseover: function (e) {
                    vm.showTooltip(seat)
                  },
                  mouseout: function (e) {
                    vm.tooltip.active = false
                  }
                }
              })
            }
          })
        ]),
        /* /seats */

        /* stages */
        vm.stages.map(function (stage) {
          return createElement('g', {
            domProps: {
              innerHTML: stage.html
            }
          })
        }),
        /* /stages */

        /* facilities */
        vm.facilities.map(function (facility) {
          return createElement('g', {
            domProps: {
              innerHTML: facility.html
            }
          })
        }),
        /* /facilities */

        /* disabilities */
        vm.disabilities.map(function (disability) {
          return createElement('g', {
            domProps: {
              innerHTML: disability.html
            }
          })
        }),
        /* /disabilities */
      ]),
      /* /svg */

      /* tooltip */
      createElement('span', {
        style: vm.styles.tooltip,
        attrs: {
          class: 'tooltip'
        },
        domProps: {
          innerHTML: vm.tooltip.content
        },
        directives: [
          {
            name: 'show',
            value: vm.tooltip.active
          }
        ]
      }),
      /* /tooltip */

      /* manipulate block */
      createElement('div', {
        attrs: {
          class: 'manipulate'
        }
      }, [
        createElement('button', {
          attrs: {
            class: 'btn'
          },
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
        ]),
        createElement('button', {
          attrs: {
            class: 'btn'
          },
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
          attrs: {
            class: 'btn'
          },
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
        ])
      ]),
      /* /manipulate block */

      /* legend panel */
      createElement('div', {
        attrs: {
          class: 'legend-list-panel'
        },
        directives: [
          {
            name: 'show',
            value: vm.legend.length > 0
          }
        ]
      }, [
        createElement('ul', {
          attrs: {
            class: 'legend-list'
          }
        }, [
          vm.legend.map(function (item) {
            return createElement('li', {
              key: item.color,
              on: {
                mouseover: function (e) {
                  e.preventDefault()
                  e.stopPropagation()
                  vm.showHoverCategory(item.name)
                },
                mouseleave: function (e) {
                  e.preventDefault()
                  e.stopPropagation()
                  vm.showHoverCategory(undefined)
                }
              }
            }, [
              createElement('div', {
                attrs: {
                  class: 'block'
                },
                style: {
                  'background-color': item.color
                }
              }),
              item.name
            ])
          })
        ])
      ])
      /* /legend panel */
    ])
  }
}

</script>

<style lang="sass" scoped>
  /* _xeats_: Do Not remove this for import in vframe */
  ._xeats_ {position: static;}

  svg {
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    cursor: grab;
    cursor: -webkit-grab;
    transition: all .3s ease;
    background-color: transparent;
    position: relative;
    z-index: 1;
  }

  .container {
    position: relative;
    background-size: 20px 20px;
    background-color: white;
    background-image: linear-gradient(to right, #EEE 1px, transparent 1px), linear-gradient(to bottom, #EEE 1px, transparent 1px);
  }

  .seat {
    cursor: pointer;
    transition: 0.5s;

    &.unavailable {
      cursor: not-allowed;
    }

    &.hover-category {
      animation: hover-category-animation .8s infinite;
    }

    @keyframes hover-category-animation {
      0%   { opacity: 0.3; stroke: #FFF; stroke-width: 8; }
      100% { opacity: 1; stroke: #444; stroke-width: 2; }
    }
  }

  .manipulate {
    position: absolute;
    z-index: 2;
    top: 30px;
    left: 30px;
    cursor: pointer;
    border: 1px solid #CCC;
    border-radius: 3px;
    background-color: white;
    box-shadow: 0 1px 2px #DDD;
    padding: 5px 0;

    button {
      float: left;
      padding: 5px 12px;
      background-color: transparent;
      border: none;
      border-right: 1px solid #CCC;
      text-align: center;
      vertical-align: middle;
      font-size: 14px;
      cursor: pointer;
      color: #A1A1A1;

      &.btn:hover {
        color: black;
      }

      &.diff {
        color: #108ee9;
      }

      &:last-child {
        border-right: none;
      }

      &.active {
        color: black;
      }
    }
  }

  .legend-list-panel {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 12;
    top: 35px;
    right: 30px;
    border: 1px solid #CCC;
    border-radius: 3px;
    background-color: white;
    box-shadow: 0 1px 2px #DDD;
    padding: 5px;
  }

  .legend-list {
    margin: 0;
    padding: 0;
    list-style: none;
    // width: 320px;
    max-height: 480px;
    overflow: auto;

    .block {
      width: 20px;
      height: 20px;
      margin-right: 10px;
    }

    li {
      padding: 8px 10px;
      color: rgba(0, 0, 0, 0.65);
      font-weight: 500;
      font-size: 12px;
      transition: .3s ease;
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;

      &:hover {
        color: #108ee9;
      }

      &+li {
        border-top: 1px solid #ccc;
      }

    }
  }

  .tooltip {
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    color: #FFF;
    border: 1px solid #333;
    border-radius: 3px;
    padding: 3px 6px;
    background: #333;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 2;
    white-space: nowrap;
    text-align: center;
  }

  .loader, .loader-figure {
    position: absolute;
    z-index: 3;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  $loader-color: orange;

  .loader {
    overflow: visible;
    padding-top: 50px;
    width: 50px;
    height: 0;
  }

  .loader-figure {
    width: 0;
    height: 0;
    box-sizing: border-box;
    border: 0 solid $loader-color;
    border-radius: 50%;
    animation-name: loader-figure;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-out;
  }

  .loader-label {
    color: $loader-color;
    float: left;
    margin-left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;

    &.animate {
      animation-name: loader-label;
      animation-duration: 1s;
      animation-iteration-count: infinite;
      animation-timing-function: ease-out;
    }

    &.error {
      color: red;
    }
  }

 @keyframes loader-figure {
  0% {
    width: 0;
    height: 0;
    background-color: $loader-color;
  }

  29% {
    background-color: $loader-color;
  }

  30% {
    width: 50px;
    height: 50px;
    background-color: transparent;
    border-width: 25px;
    opacity: 1
  }

  100% {
    width: 50px;
    height: 50px;
    border-width: 0;
    opacity: 0;
    background-color: transparent;
  }
 }

 @keyframes loader-label {
   0% {
     opacity: 0.25;
   }

   30% {
     opacity: 1;
   }

   100% {
     opacity: 0.25;
   }
 }

</style>