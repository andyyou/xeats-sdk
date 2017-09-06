<script>
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

function hsl2hex (h, s, l) {

    var r, g, b, m, c, x

    if (!isFinite(h)) h = 0
    if (!isFinite(s)) s = 0
    if (!isFinite(l)) l = 0

    h /= 60
    if (h < 0) h = 6 - (-h % 6)
    h %= 6

    s = Math.max(0, Math.min(1, s / 100))
    l = Math.max(0, Math.min(1, l / 100))

    c = (1 - Math.abs((2 * l) - 1)) * s
    x = c * (1 - Math.abs((h % 2) - 1))

    if (h < 1) {
        r = c
        g = x
        b = 0
    } else if (h < 2) {
        r = x
        g = c
        b = 0
    } else if (h < 3) {
        r = 0
        g = c
        b = x
    } else if (h < 4) {
        r = 0
        g = x
        b = c
    } else if (h < 5) {
        r = x
        g = 0
        b = c
    } else {
        r = c
        g = 0
        b = x
    }

    m = l - c / 2
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function debounce(func, wait = 20, immediate = false) {
  let timeout;
  return function() {
    let context = this,
      args = arguments;
    let later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function filterInt (value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
}

const DEFAULT = {
  SEAT: {
    unavailableColor: '#d3d3d3',      // This color means the seat is unavailable
    errorColor: '#000000',            // This color means something go wrong
    preventDefaultColor: '#DD9D62',   // If manager choose color in DEFAULT, then change to this color.
    shape: 'circle',
    tooltipContent: '無法購買'
  },
  ZOOM: {
    scale: 0.5,
    max: 2,
    min: 0.5
  }
}
const SEAT_STATUS = {
  unavailable: 0,
  available: 1,
  reserved: 2,
  other: 3
}

const SEATS_SHAPE = {
  rect: {
    content: 'rectangle',
    htmlAttr: function() {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        fill: this.picked ? darken(this.fill, -0.2) : this.fill,
      }
    }
  },
  circle: {
    content: 'circle',
    htmlAttr: function () {
      return {
        cx: this.x + this.width / 2,
        cy: this.y + this.height / 2,
        r: Math.min(this.width / 2, this.height / 2),
        fill: this.picked ? darken(this.fill, -0.2) : this.fill,
      }
    }
  }
}

const ERROR_MESSAGE = {
  getSeatsFailed: '無法取得座位表，請稍後重試',
  saveFailed: '存檔失敗',
  seatsLocked: '此座位表目前為 Lock 狀態，無法編輯，如需變更請聯絡管理者',
  browserNotSupported: '目前您所用的瀏覽器不支援此功能',
  invalidFormat: '您輸入的流水號格式錯誤',
  unequalSnSeatSize: '輸入的流水號數量和座位數量不符'
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
      type: String,
      required: true
    },
    zoomMax: {
      type: Number,
      default: DEFAULT.ZOOM.max
    },
    zoomMin: {
      type: Number,
      default: DEFAULT.ZOOM.min
    },
    categories: {
      type: Array,
      required: true
    },
    disableWheel: {
      type: Boolean,
      default: false
    },
    /**
     * For generate form fields out of iframe
     * Administrator panel no need to use form-post (optional)
     */
    generateFormFields: {
      type: Function
    },
    onAfterSave: {
      type: Function
    },
    info: {
      type: Object
    }
  },
  data () {
    return {
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
      /**
       * data for Mongodb document model
       */
      seatsDocument: {
        _id: '',
        name: '',
        comment: '',
        shape: ''
      },
      /**
       * Booking amount for limitation
       */
      amount: 0,
      /**
       * Tooltip and alert are for providing supplementary information
       */
      tooltip: {
        content: "",
        active: false,
        left: 0,
        top: 0,
        timer: null
      },
      alert:{
        active: false,
        title: '',
        content: ''
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
       * select a color for apply to seats object's fill
       * show in setup-panel-category e.g. current color & category
       */
      applyToSeatColor: DEFAULT.SEAT.unavailableColor,
      category: (typeof this.categories[0] === 'string') ? this.categories[0] : this.categories[0].name,
      categoryItems: this.categories.map((category, index, array) => {
        let categoryItem = {}
        if (typeof category === 'string') {
          categoryItem.name = category
        } else {
          categoryItem = Object.assign({comment: null, info: null, name: null, sn: null, start_at: null, end_at: null}, category)
          categoryItem.start_at = categoryItem.start_at ? new Date(categoryItem.start_at).toISOString() : null
          categoryItem.end_at = categoryItem.end_at ? new Date(categoryItem.end_at).toISOString() : null
        }
        if(!categoryItem.name){
          throw new Error('Error on setting categories in sdk')
        }
        categoryItem.color = hsl2hex(index * (360 / array.length) % 360, 55, 70)
        return categoryItem
      }),

      /**
       * hoverCategory is for category which been hovered on legend
       */
      hoverCategory: '',

      /**
       * Status for loader
       */
      loading: true,
      ajaxFailed: null,
      /**
       * Status for save
       */
      diff: false,
      autoSn: {
        prefix: '',
        startSn: '',
        endSn: '',
      },
    }
  },
  components: {
    'spots-list': spotsList
  },
  methods: {
    initialize (vm, res) {

      vm.seatsDocument = Object.assign({}, vm.seatsDocument, {
        name: res.data.name,
        comment: res.data.comment,
        shape: res.data.shape || DEFAULT.SEAT.shape           // circle is default shape
      })

      vm.seats = res.data.objects.filter(obj => obj.type === 'seat')
      vm.stages = res.data.objects.filter(obj => obj.type === 'stage')
      vm.facilities = res.data.objects.filter(obj => obj.type === 'facility')
      vm.disabilities = res.data.objects.filter(obj => obj.type === 'disability')

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
          comment: seat.comment || null,
          category: seat.category || null,
          info: seat.info || null,
          sn: seat.sn || null,
          start_at: seat.start_at || null,
          end_at: seat.end_at || null,
          fill: seat.fill || DEFAULT.SEAT.unavailableColor,
          status: seat.status || SEAT_STATUS.unavailable,
          /* For picking to set seat */
          picked: false
        })
      })
      this.reset()
    },
    /**
     * For change/reset spot
     */
    resetSeats (spotId) {
      this.loading = true
      let vm = this

      vm.$http.get(`/spots/${spotId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('_x_t')}`
        }
      })
      .then(res => {

        // Catch request error
        if (res.data && res.data.error) {
          vm.ajaxFailed = 'Saving failed. Try to save again later.'
          vm.emitAlert(`${ERROR_MESSAGE.getSeatsFailed}（${res.data.error}）`)
          return
        }

        // Replace seats with new spots
        vm.initialize(vm, res)
        vm.seatsDocument.spotId = spotId
        vm.seatsDocument.spotName = res.data.name
        vm.seatsDocument.name = null
        vm.seatsDocument.comment = null

         // set autoSn
        vm.autoSn = Object.assign({}, {
          prefix: '',
          startSn: '',
          endSn: ''
        })

        vm.loading = false
        vm.mode = 'pan-zoom'
      })
      .catch( error => {
        vm.ajaxFailed = 'API request failed, Try to reload please.'
        vm.emitAlert(ERROR_MESSAGE.getSeatsFailed)
        console.error('error', error)
      })
    },
    /**
     * Show Selected Category which is hover on Legend
     */
    showHoverCategory (category) {
      this.hoverCategory = category
    },
    updateCategoryColor(category){
      let categoryIndex = this.categoryItems.findIndex(item => {
        return item.name === category
      })
      this.applyToSeatColor = this.categoryItems[categoryIndex].color
    },
    buttonTooltip (buttonEventTarget) {
      // 如果自己（<i>）的 dataset 找不到 content，則找父層的（<button>）
      let content = buttonEventTarget.target.dataset.content || buttonEventTarget.target.parentNode.dataset.content
      this.tooltip.active = true
      this.tooltip.content = content
      this.tooltip.left = buttonEventTarget.target.offsetLeft + 25
      this.tooltip.top = 75
    },
    seatTooltip (seat){
      this.tooltip.active = true
      this.tooltip.content = `${seat.label} <br> ${(seat.category || DEFAULT.SEAT.tooltipContent)} <br> ${(seat.sn) ? seat.sn : ''}`     // tooltipContent: 無法購買

      let svgCanvas = this.$el.querySelector('#svg-canvas')
      let point = svgCanvas.createSVGPoint()
      point.x = seat.x
      point.y = seat.y

      // Update point base on current transform matrix
      point = point.matrixTransform(svgCanvas.getScreenCTM())

      // Offset point base svg translate x, y
      this.tooltip.left = point.x - svgCanvas.parentNode.getBoundingClientRect().left
      this.tooltip.top = (point.y + (seat.height + 5) / this.viewBox.scale) - svgCanvas.parentNode.getBoundingClientRect().top
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
        scale += DEFAULT.ZOOM.scale
        if (scale >= this.viewBox.scaleRange.maxScale ) {
          scale = this.viewBox.scaleRange.maxScale
        }
      } else if(effect === 'in') {
        scale -= DEFAULT.ZOOM.scale
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
    pick: debounce(function (seat, e) {

      if (this.mode === 'picking') {

        this.seats = this.seats.map(function (s) {

          // Let manager can pick multiple seats through cmd key(metaKey)
          let picked = (e.metaKey) ? s.picked : false

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
        this.around.x = begin.x - svg.parentNode.getBoundingClientRect().left
        this.around.y = begin.y - svg.parentNode.getBoundingClientRect().top
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

      let changedColor = options.clean ? DEFAULT.SEAT.unavailableColor : vm.applyToSeatColor
      let changeCategory = options.clean ? null : vm.category
      let changeStatus = options.clean ? SEAT_STATUS.unavailable : SEAT_STATUS.available

      vm.seats = vm.seats.map(seat => {
        if (seat.picked) {
          let index = vm.categoryItems.findIndex(item => item.name === changeCategory)
          return Object.assign({}, seat, {
            // 如果 vm.categoryItems[index] 不存在，表示使用者選擇 clean
            fill: changedColor,
            category: (vm.categoryItems[index]) ? vm.categoryItems[index].name : null,
            info: (vm.categoryItems[index]) ? vm.categoryItems[index].info : null,
            comment: (vm.categoryItems[index]) ? vm.categoryItems[index].comment : null,
            /**
             * sn 改成透過配號的方式給，無法在 SDK 外層透過參數給進來設定
             **/
            // sn: (vm.categoryItems[index]) ? vm.categoryItems[index].sn : null,
            start_at: (vm.categoryItems[index]) ? vm.categoryItems[index].start_at : null,
            end_at: (vm.categoryItems[index]) ? vm.categoryItems[index].end_at : null,
            status: changeStatus,
            picked: false
          })
        } else {
          return seat
        }
      })
    },
    save () {
      this.mode = 'save'
      this.loading = true

      let vm = this

      let autoSn = {
        prefix: vm.autoSn.prefix || null,
        startSn: vm.autoSn.startSn || null,
        endSn: vm.autoSn.endSn || null
      }

      vm.$http.post(`/seats/${vm.seatsDocument._id}`, {
          objects: vm.seats.concat(vm.stages, vm.facilities, vm.disabilities),
          name: vm.seatsDocument.name || null,
          shape: vm.seatsDocument.shape,
          spot_id: vm.seatsDocument.spotId,
          spot_name: vm.seatsDocument.spotName,
          comment: vm.seatsDocument.comment || null,
          info: Object.assign({}, {autoSn}, vm.info),
          svg: vm.svg
      }, {headers: {
          'Authorization': `Bearer ${localStorage.getItem('_x_t')}`,
          'Content-Type': 'application/json'
        }})
      .then(res => {
        vm.loading = false
        vm.diff = false
        /**
         * Catch request error
        **/
        if (res.data && res.data.error) {
          vm.ajaxFailed = 'Saving failed. Try to save again later.'
          vm.emitAlert( `${ERROR_MESSAGE.saveFailed}（${res.data.error}）`)
          return
        }

        /**
         * After save back to pan-zoom mode
         */
        vm.mode = 'pan-zoom'
        /**
         * onAfterSave: This is for sending seatsId
         */
        vm.$nextTick(vm.onAfterSave({
          seatsId: vm.seatsDocument._id,
          ticketInfo: vm.legend.map(category => {
            return {
              ticketId: category.categoryInfo.ticket_id || category.categoryInfo.ticketId,
              count: category.count
            }
          })
        }))
      })
      .catch(error => {
        vm.ajaxFailed = 'Saving failed. Try to save again later.'
        vm.emitAlert(ERROR_MESSAGE.saveFailed)
        console.error('error', error)
      })
    },
    emitAlert(content) {
      this.alert.title = content
      this.alert.active = true
    },
    assignSn () {

      let startSn = filterInt(this.autoSn.startSn)
      let endSn = filterInt(this.autoSn.endSn)
      let snLength = Math.max(this.autoSn.startSn.length, this.autoSn.endSn.length)
      let snSize = endSn - startSn + 1

      if (!startSn || !endSn) {
        // 如果輸入的格式有誤（不是數值）
        this.emitAlert(`${ERROR_MESSAGE.invalidFormat} (${startSn}, ${endSn})`)
        return
      }

      if (startSn > endSn) {
        // 如果輸入的起號大於迄號
        this.emitAlert(`${ERROR_MESSAGE.invalidFormat} (${startSn}, ${endSn})`)
        return
      }

      if (snSize !== this.seats.length + this.disabilities.length) {
        this.emitAlert(ERROR_MESSAGE.unequalSnSeatSize)
        return
      }

      let sn = []
      let pad = new Array(snLength + 1).join('0')
      for (let i = startSn; i <= endSn; i++){
        sn.push(this.autoSn.prefix + pad.substring(0, pad.length - i.toString().length) + i.toString())
      }

      if (sn.length !== this.seats.length + this.disabilities.length) {
         this.emitAlert('Oops!! Some error occurred in assignSn()')
         return
      }

      this.seats = this.seats.map((seat, index) => {
        return Object.assign({}, seat, {
          sn: sn.shift()
        })
      })

      this.disabilities = this.disabilities.map((disability, index) => {
        return Object.assign({}, disability, {
          sn: sn.shift()
        })
      })

      if (sn.length > 0) {
         this.emitAlert('Oops!! Some error occurred in assignSn()')
         return
      }

      this.emitAlert('自動配發流水號成功')
      this.mode = 'pan-zoom'
    }
  },
  computed: {
    legend () {
      let vm = this
      let counter = {}  // This is to count the number of seats in the category
      let temp = {}   // This is an empty object for reduce

      let legend = this.seats.reduce( (acc, seat) => {

        counter[seat.category] = counter[seat.category] ? counter[seat.category] + 1 : 1

        if (seat.lock === true) {
          // 如果有任何座位是 lock 狀態
          vm.emitAlert(ERROR_MESSAGE.seatsLocked)
        }

        let key = seat.category + '|' + seat.fill

        if (!temp[key] && seat.fill !== DEFAULT.SEAT.unavailableColor) {
          temp[key] = true;

          let categoryStatus = null
          let categoryStartAt = null
          let categoryEndAt = null

          if (seat.start_at && seat.end_at) {
            // 如果該 category 有給 start_at 和 end_at 則判斷該票卷狀態
            let currentTimeStamp = Date.now()
            let startAtTimeStamp = new Date(seat.start_at).getTime()
            let endAtTimeStamp = new Date(seat.end_at).getTime()
            categoryStartAt = new Date(seat.start_at).toLocaleString()
            categoryEndAt = new Date(seat.end_at).toLocaleString()

            if (currentTimeStamp < startAtTimeStamp ) {
              // 尚未開賣
              categoryStatus = '尚未開賣'
            } else if (currentTimeStamp > endAtTimeStamp){
              // 超過購買時間
              categoryStatus = '已逾售票日期'
            } else {
              // 可以購買
              categoryStatus = '販賣中'
            }
          }

          return acc.concat({
            name: seat.category,
            color: seat.fill,
            categoryStartAt,
            categoryEndAt,
            categorySn: seat.sn || null,
            categoryComment: seat.comment || null,
            categoryInfo: seat.info || null,
            categoryStatus,
          })
        } else {
          return acc
        }
      }, [])

      legend = legend.map(category => {
        return Object.assign({}, category, {count: counter[category.name]})
      })

      // sort for clarity of legend
      legend.sort((a, b) => {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      })

      return legend
    },
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
    },
    isSnAssigned () {
      return this.seats.some(seat => (seat.sn) ? true : false)
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
    vm.$http.post(`/seats/${vm.seatsKey}/get_or_create`, null,{
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('_x_t')}`
      }
    })
    .then(res => {

      // Catch request error
      if (res.data && res.data.error) {
        // vm.ajaxFailed = 'Get Seats Failed'
        vm.emitAlert(`${ERROR_MESSAGE.getSeatsFailed}（${res.data.error}）`)
        return
      }

      vm.seatsDocument = Object.assign({}, vm.seatsDocument, {
        _id: res.data._id,
        spotId: res.data.spot,
        spotName: res.data.spot_name
      })

      // set autoSn
      if (res.data.info) {
        vm.autoSn = Object.assign({}, {
          prefix: '',
          startSn: '',
          endSn: ''
        }, res.data.info.autoSn)
      }

      vm.initialize(vm, res)
      vm.loading = false
    })
    .catch( error => {
      vm.ajaxFailed = 'API request failed, Try to reload please.'
      vm.emitAlert(ERROR_MESSAGE.getSeatsFailed)
      console.error('error', error)
    })
  },
  render (createElement) {
    let vm = this

    /**
     * Prepare directive e.g. v-pan-zoom, v-picking
     */
    let directives, directive, expressions
    if (vm.mode === 'pan-zoom' || vm.mode === 'picking') {
      expressions = {
        'pan-zoom': 'viewBox',
        'picking': 'picking'
      }

      directive = {
        /* mode is directive name */
        name: vm.mode,
        expression: expressions[vm.mode],
        modifiers: {
          vframe: true,
          'disable-wheel': vm.disableWheel
        }
      }

      directives = [directive]
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
          display: vm.ajaxFailed ? 'none' : 'block'
        }
      }),
      createElement('p', {
        class: {
          'loader-label': true,
          'animate': !vm.ajaxFailed,
          'error': vm.ajaxFailed
        }
      }, vm.ajaxFailed || 'UPDATING')
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
        style: [vm.styles.edge, {cursor: (vm.mode === 'pan-zoom') ? '-webkit-grab' : 'default'}],
        directives: directives
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
            attrs:{
              fill: "steelblue"
            },
            domProps: {
              innerHTML: disability.html,
            }
          })
        }),
        createElement('g', null, vm.seats.map(function (seat) {
          return createElement(vm.seatsDocument.shape, {
            attrs: SEATS_SHAPE[vm.seatsDocument.shape].htmlAttr.call(seat),
            class: [
                  'seat',
                  {
                    'hover-category': seat.category === vm.hoverCategory
                  }
                ],
            on: {
              click: function (e) {
                e.preventDefault()
                e.stopPropagation()
                vm.pick(seat, e)
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
                  return vm.seatTooltip(seat)
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
      /* tooltip */
      createElement('span', {
        style: vm.styles.tooltip,
        domProps: {
          innerHTML: vm.tooltip.content
        },
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
      }),

      /* /tooltip */

      /* manipulate*/
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
        // reset button
        createElement('button', {
          attrs: {
            'data-content': 'Reset seats from spots'
          },
          class: {
            active: vm.mode === 'reset',
            btn: true
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = 'reset'
            },
            mouseover: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.tooltip.timer = setTimeout(function () {
                return vm.buttonTooltip(e)
              }, 300)
            },
            mouseout: function (e) {
              e.preventDefault()
              clearTimeout(vm.tooltip.timer)
              vm.tooltip.active = false
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-th',
            },
          })
        ]),
        // pan-zoom button
        createElement('button', {
          attrs: {
            'data-content': 'Pan-Zoom Seats'
          },
          class: {
            active: vm.mode === 'pan-zoom',
            btn: true
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = 'pan-zoom'
            },
            mouseover: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.tooltip.timer = setTimeout(function () {
                return vm.buttonTooltip(e)
              }, 300)
            },
            mouseout: function (e) {
              e.preventDefault()
              clearTimeout(vm.tooltip.timer)
              vm.tooltip.active = false
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-arrows'
            }
          })
        ]),
        // picking button
        createElement('button', {
          attrs: {
            'data-content': 'Categorize Seats'
          },
          class: {
            active: vm.mode === 'picking',
            btn: true
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = 'picking'
            },
            mouseover: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.tooltip.timer = setTimeout(function () {
                return vm.buttonTooltip(e)
              }, 300)
            },
            mouseout: function (e) {
              e.preventDefault()
              clearTimeout(vm.tooltip.timer)
              vm.tooltip.active = false
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-object-group'
            }
          })
        ]),
        // auto sn button
        createElement('button', {
          attrs: {
            'data-content': 'Auto SN'
          },
          class: {
            active: vm.mode === 'autoSn',
            btn: true
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = 'autoSn'
            },
            mouseover: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.tooltip.timer = setTimeout(function () {
                return vm.buttonTooltip(e)
              }, 300)
            },
            mouseout: function (e) {
              e.preventDefault()
              clearTimeout(vm.tooltip.timer)
              vm.tooltip.active = false
            }
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'icon-sort-numeric-asc'
            }
          })
        ]),
        // save button
        createElement('button', {
          attrs: {
            'data-content': 'Save Seats'
          },
          class: {
            active: vm.mode === 'save',
            btn: true,
            diff: vm.diff
          },
          on: {
            click: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.mode = 'save'
            },
            mouseover: function (e) {
              e.preventDefault()
              e.stopPropagation()
              vm.tooltip.timer = setTimeout(function () {
                return vm.buttonTooltip(e)
              }, 300)
            },
            mouseout: function (e) {
              e.preventDefault()
              clearTimeout(vm.tooltip.timer)
              vm.tooltip.active = false
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
      // pan zoom manipulate
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
          // zoom in button
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
          // zoom out button
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
            vm.updateCategoryColor(vm.category)
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
              value: vm.seats.some(function (seat) {
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
                value: vm.applyToSeatColor
              },
              on: {
                change: function (e) {
                  let pickedColor = e.target.value.toLowerCase()
                  if (pickedColor === DEFAULT.SEAT.unavailableColor || pickedColor === DEFAULT.SEAT.errorColor) {
                    // Avoid manager pick an unavailableColor
                    pickedColor = DEFAULT.SEAT.preventDefaultColor
                    vm.emitAlert('This color is disallowed.')
                  }
                  vm.applyToSeatColor = pickedColor
                  vm.categoryItems.find(category => category.name === vm.category).color = pickedColor
                  vm.$emit('change', pickedColor)
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
                    vm.updateCategoryColor(e.target.value)
                    vm.category = e.target.value
                    vm.$emit('change', e.target.value)
                  }
                }
              },
              this.categoryItems.map( category => {
                return createElement('option',{
                  domProps: {
                    value: category.name
                  }
                }, category.name)
              })
              )
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
              value: vm.mode === 'save'
            }
          ]
        }, [
            createElement('div', {
              attrs: {
                class: 'save'
              }
            }, [
              createElement('div', {
                attrs: {
                  class: 'select-container'
                }
              }, [
                createElement('select', {
                  on:{
                    change: function (e) {
                      vm.seatsDocument.shape = e.target.value
                      vm.$emit('change', e.target.value)
                    }
                  }
                }, Object.keys(SEATS_SHAPE).map(function(shape){
                  return createElement('option', {
                    domProps: {
                      value: shape,
                      selected: shape === vm.seatsDocument.shape
                    }
                  }, SEATS_SHAPE[shape].content)
                }))
              ]),
                createElement('input', {
                  attrs: {
                    type: 'text',
                    placeholder: 'Seats Name',
                    value: vm.seatsDocument.name,
                  },
                  on: {
                    change: function (e) {
                      vm.seatsDocument.name = e.target.value
                    }
                  }
                }),
                createElement('input', {
                  attrs: {
                    type: 'text',
                    placeholder: 'Seats Comment',
                    value: vm.seatsDocument.comment,
                  },
                  on: {
                    change: function (e) {
                      vm.seatsDocument.comment = e.target.value
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
                  vm.ajaxFailed = null
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
          on: {
            'reset-spot-id': vm.resetSeats
          },
          directives: [
            {
              name: 'show',
              value: vm.mode === 'reset'
            }
          ]
        })
      ]),
      // setup-panel-for-auto-sn
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
              value: vm.mode === 'autoSn'
            }
          ]
        }, [
          createElement('div', {
            attrs: {
              class: 'auto-sn'
            }
          }, [
            createElement('input', {
              attrs: {
                type: 'text',
                placeholder: 'SN Prefix',
                disabled: vm.isSnAssigned
              },
              class: {
                disabled: vm.isSnAssigned
              },
              domProps: {
                value: vm.autoSn.prefix
              },
              on: {
                change: function (e) {
                  vm.autoSn.prefix = e.target.value
                }
              }
            }),
            createElement('input', {
              attrs: {
                type: 'text',
                placeholder: 'Start SN',
                disabled: vm.isSnAssigned
              },
              class: {
                disabled: vm.isSnAssigned
              },
              domProps: {
                value: vm.autoSn.startSn
              },
              on: {
                change: function (e) {
                  vm.autoSn.startSn = e.target.value
                  vm.autoSn.endSn = (Number(e.target.value) + vm.seats.length + vm.disabilities.length - 1).toString()
                }
              }
            }),
            createElement('input', {
              attrs: {
                type: 'text',
                placeholder: 'End SN',
                disabled: vm.isSnAssigned
              },
              class: {
                disabled: vm.isSnAssigned
              },
              domProps: {
                value: vm.autoSn.endSn
              },
              on: {
                change: function (e) {
                  vm.autoSn.endSn = e.target.value
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
                vm.assignSn()
              }
            },
            directives: [
              {
                name: 'show',
                value: !vm.isSnAssigned
              }
            ]
          }, 'Confirm'),
          createElement('button', {
            attrs: {
              class: 'btn-danger'
            },
            directives: [
              {
                name: 'show',
                value: vm.isSnAssigned
              }
            ],
            on: {
              click: function (e) {
                e.preventDefault()
                e.stopPropagation()
                let resetAutoSn = confirm('確定要重置流水號的設定嗎？')
                if (resetAutoSn) {
                  vm.seats = vm.seats.map(seat => Object.assign({}, seat, {sn: null}))
                  vm.disabilities = vm.disabilities.map(disability => Object.assign({}, disability, {sn: null}))
                }
                vm.autoSn.prefix = ''
                vm.autoSn.startSn = ''
                vm.autoSn.endSn = ''
                vm.mode='pan-zoom'
              }
            }
          }, 'Reset')
        ])
      ]),

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
                },
                click: function (e) {
                  e.preventDefault()
                  e.stopPropagation()
                  vm.alert.title = item.name
                  vm.alert.content = ''
                  if (item.categoryStartAt) {vm.alert.content += `開賣時間：${item.categoryStartAt}<br>`}
                  if (item.categoryEndAt) {vm.alert.content += `截止時間：${item.categoryEndAt}<br>`}
                  if (item.categorySn) {vm.alert.content += `SN: ${item.categorySn}<br>`}
                  if (item.categoryInfo) {vm.alert.content += `Info: ${JSON.stringify(item.categoryInfo)}<br>`}
                  if (item.categoryComment) {vm.alert.content += `Comment: ${item.categoryComment}<br>`}
                  if (vm.alert.content) {
                    vm.alert.active = true
                  }
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
              }, item.count ? item.count : ""),
              item.name,
              createElement('span', {
                attrs: {
                  class: 'badge-warn'
                },
                directives: [{
                  name: 'show',
                  value: item.categoryStatus
                }]
              }, item.categoryStatus)
            ])
          })
        ])
      ]),/* /legend panel */
      /* alert modal */
      createElement('div', {
        attrs: {
          class: 'alert-modal'
        },
        directives: [
          {
            name: 'show',
            value: vm.alert.active
          }
        ],
        on: {
          wheel: function (e) {
            e.preventDefault()
            e.stopPropagation()
          }
        }
      }, [
      createElement('div',{
        attrs: {
          class: 'alert-container'
        }
      },[
        createElement('h3', {
          attrs: {
            class: 'alert-title'
          }
        }, vm.alert.title),
        createElement('div', {
          attrs: {
            class: 'alert-content'
          },
          domProps:{
            innerHTML: vm.alert.content
          }
        }),
        createElement('div', {
          attrs: {
            class: 'button-container'
          }
        }, [
            createElement('button',{
              attrs: {
                class: 'confirm-button'
              },
              on: {
                click: function (e) {
                  e.preventDefault()
                  e.stopPropagation()
                  vm.alert.active = false
                  vm.alert.title = null
                  vm.alert.content = null
                }
              }
            }, 'OK')
          ])
        ])
      ]),/* /alert modal */
      /* show spot name */
      createElement('div', {
        attrs: {
          class: 'spot-name'
        }}, vm.seatsDocument.spotName)/* /show spot name */
    ])
  }
}
</script>

<style lang="sass" scoped>
  /* _xeats_: Do Not remove this for import in vframe */
  ._xeats_ {position: static;}

  $font: 'Helvetica Neue', Helvetica, Arial, '微軟正黑體', sans-serif;

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
    background-size: 20px 20px;
    background-color: white;
    background-repeat: repeat;

    background-image:
      linear-gradient(to right, #EEE 1px, transparent 1px),
      linear-gradient(to bottom, #EEE 1px, transparent 1px);

    /**
     * fallback for IE11
    **/
    background-image:
    -ms-linear-gradient(top, #EEEEEE 2px, transparent 2px),
    -ms-linear-gradient(left, #EEEEEE 2px, transparent 2px);
  }

  .seat {
    cursor: pointer;

    &.hover-category {
      animation: hover-category-animation .8s infinite;
    }

    @keyframes hover-category-animation {
      0%   { opacity: 0.3; stroke: #FFF; stroke-width: 8; }
      100% { opacity: 1; stroke: #444; stroke-width: 2; }
    }

  }

  input:disabled, .disabled{
    cursor: not-allowed !important;
    background-color: #eceeef !important;
    opacity: 1 !important;
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
    font-family: $font;

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
    font-family: $font;

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
    font-family: $font;

    .save, .auto-sn {

      input, select, option {
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
        height: 36px;
      }
      select {
        overflow: hidden;
        position: relative;
        margin-left: 0px;
        min-width: 120px;
        border: 1px solid #CCC;
        box-shadow: none;
        background: transparent;
        background-image: none;
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

      input[type='text'] {
        &::placeholder {
          color: #BBB;
        }
      }
      .select-container{
        position: relative;
        &:before{
          content: "\6c";
          font-family: "xeats-fonts" !important;
          position: absolute;
          right: 3px;
          top: 10px;
        }
      }
    }

    .pickers {
      display: flex;
      align-items: center;

      .select-container {
        border: 1px solid #CCC;
        border-radius: 3px;
        flex-grow: 1;
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
          content: "\6c";
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
      font-family: $font;

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
    font-family: $font;
  }

  .legend-list {
    margin: 0;
    padding: 0;
    list-style: none;
    // width: 320px;
    max-height: 480px;
    overflow: auto;

    .block {
      width: 30px;
      height: 20px;
      line-height: 20px;
      margin-right: 10px;
      text-align: center;
      padding: 3px;
      color: #FFF;
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

      .badge-warn {
        display: inline-block;
        margin-left: .4em;
        padding: .25em .4em;
        font-size: 75%;
        font-weight: 700;
        line-height: 1;
        color: #fff;
        text-align: center;
        white-space: nowrap;
        vertical-align: baseline;
        background-color: #f0ad4e;
        padding-right: .6em;
        padding-left: .6em;
        border-radius: 10rem;
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
    z-index: 30;
    white-space: nowrap;
    text-align: center;
    font-family: $font;
  }

  .spot-name{
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    z-index: 10;
    color: rgba(0, 0, 0, 0.4);
  }

  /* style of alert-modal is forked from sweetAlert */
  .alert-modal{
    font-family: $font;
    overflow-y: auto;
    background-color: rgba(0,0,0,.4);
    transition: background-color .1s;
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    padding: 10px;
    z-index: 1060;

    .alert-container{
      border-radius: 5px;
      box-sizing: border-box;
      text-align: center;
      margin: auto;
      overflow-x: hidden;
      overflow-y: auto;
      display: none;
      position: absolute;
      left: 0;
      right: 0;
      max-width: 100%;
      width: 500px;
      padding: 20px;
      background: rgb(255, 255, 255);
      display: block;
      min-height: 148px;
      animation: showAlert .3s;
    }

    .alert-title{
      color: #595959;
      font-size: 30px;
      text-align: center;
      font-weight: 600;
      text-transform: none;
      position: relative;
      margin: .4em 0;
      padding: 0;
      display: block;
      word-wrap: break-word;
    }

    .alert-content{
      font-size: 18px;
      text-align: left;
      font-weight: 300;
      position: relative;
      float: none;
      margin: 0;
      padding: 0;
      line-height: normal;
      color: #545454;
      word-wrap: break-word;
    }

    .confirm-button{
      background-color: #3085d6;
      color: #fff;
      border: 0;
      -webkit-box-shadow: none;
      box-shadow: none;
      font-size: 17px;
      font-weight: 500;
      border-radius: 3px;
      padding: 15px 35px;
      margin: 20px 5px 0;
      cursor: pointer;
      white-space: nowrap;

      &:hover{
        background-color: #297dce;
      }
    }

    @keyframes showAlert {
      0% {
        transform: scale(.7);
      }
      45% {
        transform: scale(1.05);
      }
      80% {
        transform: scale(.95);
      }
      100% {
        transform: scale(1);
      }
    }
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
    font-family: $font;
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