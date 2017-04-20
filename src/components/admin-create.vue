<script>
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

let defaultSeatColor = '#d3d3d3'

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
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      /** 
       * setting el's color of tmp 
       * current color & category
       */
      color: '#000',
      category: this.categories[0]
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
    diff () {
      return this.seats.some(function (seat) {
        return seat.category
      })
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
  watch: {
    picking: {
      handler: function (val, oldVal) {
        let vm = this
        this.seats = this.seats.map(function (seat) {
          let center = {
            x: seat.x + seat.width / 2,
            y: seat.y + seat.height / 2
          }

          let picked = ((center.x >= val.x) && 
                       (center.x <= val.x + val.width * vm.viewBox.scale) && 
                       (center.y >= val.y) && 
                       (center.y <= val.y + val.height * vm.viewBox.scale))
           
          return Object.assign({}, seat, {
            picked: picked
          })
        })
      },
      deep: true
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
          fill: defaultSeatColor,
          reserved: false,
          /* For picking to setup */
          picked: false
        })
      })
    })
    .catch( error => {
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
      this.tooltip.left = point.x - svgCanvas.parentElement.getBoundingClientRect().left
      this.tooltip.top =  (point.y + (seat.height + 5) / this.viewBox.scale) - svgCanvas.parentElement.getBoundingClientRect().top
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
    pick (seat) {
      if (this.mode === 'picking') {
        seat.picked = !seat.picked
      }
    },
    setCategory (options) {
      let vm = this

      if (options == null) {
        options = {}
        options['clean'] = false
      }

      if (options['clean'] == null) {
        options['clean'] = false
      }

      let changedColor = options.clean ? defaultSeatColor : vm.color
      let category = options.clean ? null : vm.category

      this.seats = this.seats.map(function (seat) {
        let fill = seat.picked ? changedColor : seat.fill
        
        return Object.assign({}, seat, {
          fill: fill,
          category: category,
          picked: false
        })
      })
    },
    save () {
      // TODO: Save by calling API
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
      createElement('div', null, `(${this.picking.x}, ${this.picking.y}) - ${this.picking.width} / ${this.picking.height}`),
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
              fill: seat.picked ? darken(seat.fill, -0.2) : seat.fill,
              class: 'seat'
            },
            on: {
              click: function (e) {
                e.preventDefault()
                e.stopPropagation()
                vm.pick(seat)
              },
              touchend: function () {
                vm.pick(seat)
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
            active: vm.mode === 'pan-zoom',
            btn: true
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
            active: vm.mode === 'picking',
            btn: true
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
          class: {
            diff: vm.diff
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.save()
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-floppy-o'
            }
          })
        ])
      ]),
      createElement('transition', {
        props: {
          name: 'fade'
        }
      }, [
        createElement('div', {
          attrs: {
            class: 'sub-manipulate'
          },
          directives: [
            {
              name: 'show',
              value: vm.mode === 'pan-zoom'
            }
          ]
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
        ])
      ]),
      createElement('transition', {
        props: {
          name: 'fade'
        },
        on: {
          'before-enter': function () {
            vm.color = '#' + ((1 << 24) * Math.random() | 0).toString(16)
          }
        }
      }, [
        createElement('div', {
          attrs: {
            class: 'setup-panel'
          },
          directives: [
            {
              name: 'show',
              value: this.seats.some(function (seat) {
                return seat.picked
              })
            }
          ]
        }, [
          createElement('div', {
            attrs: {
              class: 'pickers'
            }
          }, [
            createElement('input', {
              attrs: {
                type: 'color',
                class: 'color-cube'
              },
              domProps: {
                value: vm.color
              },
              on: {
                change: function (e) {
                  vm.color = e.target.value
                  vm.$emit('change', e.target.value)
                }
              }
            }),
            createElement('div', {
              attrs: {
                class: 'select-container'
              }
            }, [
              createElement('select', {
                domProps: {
                  value: vm.category
                },
                on: {
                  change: function (e) {
                    vm.category = e.target.value
                    vm.$emit('change', e.target.value)
                  }
                }
              }, this.categories.map(function (category) {
                return createElement('option', {
                  domProps: {
                    value: category
                  }
                }, category)
              }))
            ])
          ]),
          createElement('button', {
            attrs: {
              class: 'btn-primary'
            },
            on: {
              click: function (e) {
                return vm.setCategory()
              }
            }
          }, 'Confirm'),
          createElement('button', {
            attrs: {
              class: 'btn-danger'
            },
            on: {
              click: function (e) {
                return vm.setCategory({
                  clean: true
                })
              }
            }
          }, 'Clean')
        ])
      ])
    ])
  }
}
</script>

<style lang="sass" scoped>
  svg {
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    transation: all .3s ease;
    background-color: transparent;
  }

  .container {
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
    position: absolute;
    z-index: 10;
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

  .sub-manipulate {
    position: absolute;
    display: flex;
    flex-direction: column;
    z-index: 10;
    top: 80px;
    left: 30px;
    cursor: pointer;
    border: 1px solid #CCC;
    border-radius: 3px;
    background-color: white;
    box-shadow: 0 1px 2px #DDD;
    padding: 5px;

    button {
      padding: 6px;
      background-color: transparent;
      border: none;
      border-bottom: 1px solid #CCC;
      text-align: center;
      vertical-align: middle;
      font-size: 14px;
      cursor: pointer;
      color: #A1A1A1;

      &.btn:hover {
        color: black;
      }

      &:last-child {
        border-bottom: none;
      }

      &.active {
        color: black;
      }
    }
  }

  .setup-panel {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: around-between;
    z-index: 10;
    top: 80px;
    left: 30px;
    border: 1px solid #CCC;
    border-radius: 3px;
    background-color: white;
    box-shadow: 0 1px 2px #DDD;
    padding: 5px;

    .pickers {
      display: flex;
      align-items: center;

      .select-container {
        border: 1px solid #CCC;
        border-radius: 3px;
        flex: 1;
        overflow: hidden;
        position: relative;
        margin-left: 8px;

        select {
          min-width: 120px;
          border: none;
          box-shadow: none;
          background: transparent;
          background-image: none;
          padding: 5px 8px;
          font-weight: 500;
          color: rgba(0,0,0,.65);
          outline: 0;
          -webkit-appearance: none;
          -moz-appearance: none;
          
          &:-moz-focusring {
              color: transparent;
              text-shadow: 0 0 0 #000;
          }
          &:focus {
            outline: none;
          }
        }
        
        &:before {
          content: "\e00a";
          font-family: "xeats-fonts" !important;
          top: 5px;
          right: 5px;
          position: absolute;
        }
      }
    }

    .color-cube {
      width: 23px;
      border: none;
      padding: 0;
      margin: 5px;
    }
    
    button {
      border: 1px solid #CCC;
      background-color: white;
      border-radius: 3px;
      align-self: flex-end;
      padding: 5px 8px;
      margin-top: 5px;
      cursor: pointer;
      color: rgba(0,0,0,.65);
      font-weight: 500;
      font-size: 12px;
      line-height: 1.5em;
      width: 100%;
      transition: all .3s ease;
      
      &.btn-primary:hover {
        border: 1px solid #108ee9;
        color: white;
        background: #108ee9;
      }

      &.btn-danger {
        color: #c12e2a;
        border: 1px solid #c12e2a;

        &:hover {
          background: #c12e2a;
          color: white;
        }
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
    white-space: nowrap;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .1s ease-out;
  }

  .fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
    opacity: 0
  }
</style>