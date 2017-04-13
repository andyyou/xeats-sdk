import Vue from 'vue'
import VueResource from 'vue-resource'
import axios from 'axios'
import VuePanZoom from '@/plugins/vue-svg-pan-zoom'
import App from '@/components/App'

Vue.prototype.$http = axios

/**
 * TODO: Those variables need from API
 */
const WIDTH = 800
const HEIGHT = 600

const VIEWPORT = {
  width: 1913.7,
  height: 937.3
}

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame
window.requestAnimationFrame = requestAnimationFrame
Vue.use(VueResource)
Vue.use(VuePanZoom)

/**
 * SDK Main Class
 */
class Xeat {
  constructor (options) {
    this.options = options
    /**
     * TODO:
     * Now get data from variables
     * 
     *   0. Get viewbox size
     *   1. Get seats
     */
    return new Vue({
      el: this.options.el,
      template: `
        <app 
          :width="${this.options.width}" 
          :height="${this.options.height}" 
          spot="${this.options.spot}"
          :zoomMax="${this.options.zoomMax}"
          :zoomMin="${this.options.zoomMin}"
          :token="${this.options.token}"
          :autoSize="${this.options.autoSize}"
          :amountMax="${this.options.amountMax}"
          :amountMin="${this.options.amountMin}"
        >
        </app>
      `,
      components: {
        App
      }
    })
  }
}

window.Xeat = Xeat
export default Xeat