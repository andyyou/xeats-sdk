<script>
import _ from 'lodash'
import spotsList from '@/components/spots-list.vue'

function darken (color, percent) {
  let f = parseInt(color.slice(1),16),
      t = (percent < 0) ? 0:255,
      p = (percent < 0) ? percent * -1 : percent,
      R = f>>16,
      G = f>>8 & 0x00FF,
      B = f & 0x0000FF

  return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function getRandomColor () {
  return '#' + Math.random().toString(16).substr(-6)
}

let seatsDefault = {
  color: '#d3d3d3'
}

let seatStatus = {
  unavailable: 0,
  available: 1,
  reserved: 2,
  other: 3
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
    seatsKey: {
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
      /**
       * seatsId from API
       */
      seatsId: '',
      /**
       * Custom set viewport
       */
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
          maxScale: Number,     // maxScale means smaller figure
          minScale: Number      // minScale means larger figure
        }
      },
      /**
       * svg objects will divide 4 types
       */
      seats: [],
      stages: [],
      facilities: [],
      disabilities: [],
      seatsInfo: {
        name: '',
        comment: '',
        startAt: '',
        endAt: '',
        mode: '' // save | reset
      },
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
       * mode will mount directive to svg
       * `pan-zoom`, `picking` mode is the directive name 
       */
      mode: 'pan-zoom',
      /**
       * Mousemove make a selection area to select seats 
       */
      picking: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      /** 
       * Make a dotted rectangle to note selection area 
       */
      around: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      /** 
       * select a color of tmp to set into seat's fill attr
       * current color & category
       */
      color: '#333333',
      category: this.categories[0],
      categoryItems: this.categories.map(function (category) {
        return {
          name: category,
          color: getRandomColor()
        }
      }),
      /**
       * Status for loader
       */
      loading: true,
      failed: null,
      /**
       * Status for save
       */
      diff: false
    }
  },
  components: {
    'spots-list': spotsList
  },
  methods: {
    seatsInitialize (vm, res) {
      console.log('seatsInitialize')
      console.log('res.data.name', res.data.name)
      vm.seatsInfo.name = res.data.name
      vm.seatsInfo.comment = res.data.comment
      vm.seatsInfo.startAt = res.data.start_at
      vm.seatsInfo.endAt = res.data.end_at

      vm.seats = res.data.objects.filter(obj => obj.type === 'seat')
      vm.stages = res.data.objects.filter(obj => obj.type === 'stage')
      vm.facilities = res.data.objects.filter(obj => obj.type === 'facilities')
      vm.disabilities = res.data.objects.filter(obj => obj.type === 'disabilities')

      // set svg width, height in vm
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

      // ratio is for viewport, scale is for viewbox.
      // larger scale means smaller figure
      vm.viewBox.scale = vm.viewBox.initialScale = (1 / ratio)

      vm.viewBox.width = vm.svg.width
      vm.viewBox.height = vm.svg.height

      // calculated the max and min range of scale to zoom
      vm.viewBox.scaleRange.maxScale = (1 / vm.viewBox.zoomMin) * vm.viewBox.initialScale
      vm.viewBox.scaleRange.minScale = (1 / vm.viewBox.zoomMax) * vm.viewBox.initialScale

      vm.seats = vm.seats.map(function(seat) {
        return Object.assign({}, seat, {
          fill: seat.fill || seatsDefault.color,
          status: seat.status || seatStatus.unavailable,
          /* For picking to set seat */
          picked: false
        })
      })
    },
    resetSeats (spotId) {
      console.log('get spot id', spotId)
      this.loading = true
      let vm = this

      vm.$http.get(`/spots/${spotId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('_x_t')}`
        }
      })
      .then( res => {
        console.log('get reset spot data')

        vm.seatsInitialize(vm, res)

        vm.seatsInfo.name = null
        vm.seatsInfo.comment = null
        vm.seatsInfo.startAt = null
        vm.seatsInfo.endAt = null

        console.log('seat reset finish')
        vm.loading = false
        vm.mode = 'pan-zoom'
        vm.seatsInfo.mode = null
      })
    },
    getToken () {
      return this.$parent.getToken.call(this)
    },
    setToken () {
      return this.$parent.setToken.call(this)
    },
    refreshColor(category){
      let categoryIndex = this.categoryItems.findIndex( (item) => {
        return item.name === category
      })
      this.color = this.categoryItems[categoryIndex].color
    },
    showTooltip (seat){
      this.tooltip.active = true
      this.tooltip.content = seat.label

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
        if (scale >= this.viewBox.scaleRange.maxScale ) {
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
    pick: _.debounce(function (seat) {
      if (this.mode === 'picking') {
        
        this.seats = this.seats.map(function (s) {
          let picked = false
          if (seat.node_id === s.node_id) {
            picked = !s.picked
          }
          return Object.assign({}, s, {
            picked: picked
          })
        })

        this.$nextTick(this.updateDottedAround)
      }
    }, 100),
    updateDottedAround () {
      // Make dotted rectangle
      let seats = this.seats.filter(function (seat) {
        return seat.picked
      })
      
      if (seats.length > 0) {
        let left = seats.reduce(function (prev, curr, index, arr) {
          return prev.x < curr.x ? prev : curr
        })
        let right = seats.reduce(function (prev, curr, index, arr) {
          return prev.x > curr.x ? prev : curr
        })
        let top = seats.reduce(function (prev, curr, index, arr) {
          return prev.y < curr.y ? prev : curr
        })
        let bottom = seats.reduce(function (prev, curr, index, arr) {
          return prev.y > curr.y ? prev : curr
        })

        /**
          * Calculate dotted around
          */
        let svg = this.$el.querySelector('#svg-canvas')
        let el = this.$el.querySelector('.dotted-around')
        let begin = svg.createSVGPoint()
        let moveTo = svg.createSVGPoint()
        begin.x = left.x - 4    // for around space inside
        begin.y = top.y - 4
        moveTo.x = right.x + right.width
        moveTo.y = bottom.y + bottom.height
        begin = begin.matrixTransform(svg.getScreenCTM())
        moveTo = moveTo.matrixTransform(svg.getScreenCTM())
        this.around.x = begin.x - svg.parentElement.getBoundingClientRect().left
        this.around.y = begin.y - svg.parentElement.getBoundingClientRect().top
        this.around.width = (moveTo.x - begin.x)
        this.around.height = (moveTo.y - begin.y)
      } else {
        this.around.x = 0
        this.around.y = 0
        this.around.width = 0
        this.around.height = 0
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

      let changedColor = options.clean ? seatsDefault.color : vm.color
      let changeCategory = options.clean ? null : vm.category
      let changeStatus = options.clean ? seatStatus.unavailable : seatStatus.available

      this.seats = this.seats.map(function (seat) {
        let fill = seat.picked ? changedColor : seat.fill
        let category = seat.picked ? changeCategory : seat.category
        let status = seat.picked ? changeStatus : seat.status

        return Object.assign({}, seat, {
          fill: fill,
          category: category,
          status: status,
          picked: false
        })
      })
    },
    save () {
      this.mode = null
      this.seatsInfo.mode = 'save'
      this.loading = true

      let vm = this
      
      console.log('send', vm.seatsInfo.name)
      vm.$http.put(`/seats/${vm.seatsId}`, {
          objects: vm.seats,
          name: vm.seatsInfo.name,
          comment: vm.seatsInfo.comment
      }, {headers: {
          'Authorization': `Bearer ${localStorage.getItem('_x_t')}`,
        }})
      .then(response => {
        vm.loading = false
        vm.diff = false
        vm.mode = 'pan-zoom'
        vm.seatsInfo.mode = null
        console.log('response', response)
      })
      .catch(error => {
        console.log('error', error)
      })
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
          height: isNaN(+this.height) ? '100%' : `${this.height}px`,
          maxHeight: '100%'   // No effect if NO any container's height outer of svg
        },
        tooltip: {
          left: `${this.tooltip.left}px`,
          top: `${this.tooltip.top}px`
        },
        around: {
          left: `${this.around.x}px`,
          top: `${this.around.y}px`,
          width: `${this.around.width}px`,
          height: `${this.around.height}px`,
          display: this.seats.some(function (seat) {
            return seat.picked
          }) ? 'block' : 'none'
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

        this.$nextTick(this.updateDottedAround)
      },
      deep: true
    }
  },
  created () {
    let vm = this
    //TODO: POST `/seats/${vm.seatsKey}`/get_or_create
    vm.$http.get(`/seats/${vm.seatsKey}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('_x_t')}`
      }
    })
    .then(res => {
      console.log('get seats data')
      // set seatsId in vm
      vm.seatsId = res.data._id
      vm.seatsInitialize(vm, res)

      vm.loading = false

    })
    .catch( error => {
      vm.failed = 'API request failed, Try to reload please.'
      console.log('error', error)
    })
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
      expression: expressions[vm.mode],
      modifiers: {
        vframe: true
      }
    }

    let loader = createElement('div', {
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
          'animate': !vm.failed,
          'error': vm.failed
        }
      }, vm.failed || 'UPDATING')
    ])

    /**
     * Begin rendering
     */
    return createElement('div', {
      attrs: {
        class: 'container'
      },
      style: vm.styles.edge
    }, [
      vm.loading ? loader : null,
      createElement('div', {
        attrs: {
          class: 'dotted-around'
        },
        style: vm.styles.around,
        on: {
          click: function (e) {
            vm.picking.x = 0
            vm.picking.y = 0
            vm.picking.width = 0
            vm.picking.height = 0
          }
        }
      }),
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
        vm.stages.map(function (stage) {
          return createElement('g', {
            domProps: {
              innerHTML: stage.html
            }
          })
        }),
        vm.facilities.map(function (facility) {
          return createElement('g', {
            domProps: {
              innerHTML: facility.html
            }
          })
        }),
        vm.disabilities.map(function (disability) {
          return createElement('g', {
            domProps: {
              innerHTML: disability.html
            }
          })
        }),
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
        },
        on: {
          mousedown: function (e) {
            e.stopPropagation()
          },
          mousemove: function (e) {
            e.stopPropagation()
          },
          mouseup: function (e) {
            e.stopPropagation()
          },
          click: function (e) {
            e.stopPropagation()
          }
        }
      }, [
        // TODO: reset button
        createElement('button', {
          class: {
            active: vm.seatsInfo.mode === 'reset',
            btn: true
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = null
              vm.seatsInfo.mode = 'reset'
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-th'
            }
          })
        ]),
        // pan-zoom button
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
              vm.seatsInfo.mode = null
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
              vm.seatsInfo.mode = null
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-object-group'
            }
          })
        ]),
        // save button
        createElement('button', {
          class: {
            diff: vm.diff
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = null
              vm.seatsInfo.mode = 'save'
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
      // zoom button
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
      // setup-panel-for-category
      createElement('transition', {
        attrs: {
          name: 'fade'
        },
        on: {
          'before-enter': function () {
            vm.refreshColor(vm.category)
          }
        }
      }, [
        createElement('div', {
          attrs: {
            class: 'setup-panel'
          },
          on: {
            mouseup: function (e) {
              e.stopPropagation()
            }
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
            },
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
                  vm.categoryItems.find( category => {
                    return category.name === vm.category
                  }).color = e.target.value

                  vm.$emit('change', e.target.value)
                }
              }
            }),
            createElement('div', {
              attrs: {
                class: 'select-container'
              },
              on: {
                mouseup: function (e) {
                  e.stopPropagation()
                }
              }
            }, [
              createElement('select', {
                domProps: {
                  value: vm.category
                },
                on: {
                  mouseup: function (e) {
                    e.stopPropagation()
                  },
                  change: function (e) {
                    vm.refreshColor(e.target.value)
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
                e.preventDefault()
                e.stopPropagation()
                vm.diff = true
                return vm.setCategory()
              },
              mouseup: function (e) {
                e.stopPropagation()
              }
            }
          }, 'Confirm'),
          createElement('button', {
            attrs: {
              class: 'btn-danger'
            },
            on: {
              click: function (e) {
                e.preventDefault()
                e.stopPropagation()
                return vm.setCategory({
                  clean: true
                })
              }
            }
          }, 'Clean')
        ])
      ]),
      // setup-panel-for-save
      createElement('transition', {
        props: {
          name: 'fade'
        }
      }, [
        createElement('div', {
          attrs: {
            class: 'setup-panel'
          },
          on: {
            mouseup: function (e) {
              e.stopPropagation()
            }
          },
          directives: [
            {
              name: 'show',
              value: vm.seatsInfo.mode === 'save'
            }
          ]
        }, [
            createElement('div', {
              attrs: {
                class: 'save'
              }
            }, [
                createElement('input', {
                  attrs: {
                    type: 'text',
                    placeholder: 'Seats Name',
                    value: vm.seatsInfo.name,
                  },
                  on: {
                    change: function (e) {
                      vm.seatsInfo.name = e.target.value
                    }
                  }
                }),
                createElement('input', {
                  attrs: {
                    type: 'text',
                    placeholder: 'Seats Comment',
                    value: vm.seatsInfo.comment,
                  },
                  on: {
                    change: function (e) {
                      vm.seatsInfo.comment = e.target.value
                    }
                  }
                })
              ]),
            createElement('button', {
              attrs: {
                class: 'btn-primary'
              },
              on: {
                click: function (e) {
                  e.preventDefault()
                  e.stopPropagation()
                  vm.save()
                }
              }
            }, 'Save'),
            createElement('button', {
              attrs: {
                class: 'btn-danger'
              },
              on: {
                click: function (e) {
                  e.preventDefault()
                  e.stopPropagation()
                  vm.seatsInfo.mode = null
                  vm.mode='pan-zoom'
                }
              }
            }, 'Cancel')
        ])
      ]),
      // setup-panel-for-reset-seats
      createElement('transition', {
        props: {
          name: 'fade'
        }
      }, [
        createElement('spots-list', {
          attrs: {
            class: 'setup-panel'
          },
          on: {
            'reset-spot-id': vm.resetSeats
          },
          directives: [
            {
              name: 'show',
              value: vm.seatsInfo.mode === 'reset'
            }
          ]
        }, [
            createElement('div', {
              attrs: {
                class: 'save'
              }
            }, [
                createElement('input', {
                  attrs: {
                    type: 'text',
                    placeholder: 'Seats Name',
                    value: vm.seatsInfo.name,
                  },
                  on: {
                    change: function (e) {
                      vm.seatsInfo.name = e.target.value
                    }
                  }
                }),
                createElement('input', {
                  attrs: {
                    type: 'text',
                    placeholder: 'Seats Comment',
                    value: vm.seatsInfo.comment,
                  },
                  on: {
                    change: function (e) {
                      vm.seatsInfo.comment = e.target.value
                    }
                  }
                })
              ]),
            createElement('button', {
              attrs: {
                class: 'btn-primary'
              },
              on: {
                click: function (e) {
                  e.preventDefault()
                  e.stopPropagation()
                  vm.save()
                }
              }
            }, 'Save'),
            createElement('button', {
              attrs: {
                class: 'btn-danger'
              },
              on: {
                click: function (e) {
                  e.preventDefault()
                  e.stopPropagation()
                  vm.seatsInfo.mode = null
                  vm.mode='pan-zoom'
                }
              }
            }, 'Cancel')
        ])
      ])
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
    transition: all .3s ease;
    background-color: transparent;
    position: relative;
    z-index: 9;
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
    justify-content: space-between;
    z-index: 12;
    top: 80px;
    left: 30px;
    border: 1px solid #CCC;
    border-radius: 3px;
    background-color: white;
    box-shadow: 0 1px 2px #DDD;
    padding: 5px;
    
    .save {
      input {
        border: 1px solid #CCC;
        background-color: white;
        border-radius: 3px;
        align-self: flex-end;
        padding: 5px 8px;
        margin-top: 5px;
        cursor: pointer;
        color: rgba(0, 0, 0, 0.65);
        font-weight: 500;
        font-size: 12px;
        line-height: 1.5em;
        transition: all .3s ease;
        display: block;
        box-sizing: border-box;
        width: 100%;
      }

      input[type='text'] {
        

        &::placeholder {
          color: #BBB;
        }
      }
    }

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
    z-index: 10;
    white-space: nowrap;
  }

  .dotted-around {
    position: absolute;
    border: 1px dotted;
    top: 0;
    left: 0;
    z-index: 11;
  }

  .loader, .loader-figure {
    position: absolute;
    z-index: 11;
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
  .fade-enter-active, .fade-leave-active {
    transition: opacity .1s ease-out;
  }

  .fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
    opacity: 0
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