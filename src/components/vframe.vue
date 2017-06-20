<template>

  <iframe
    @load="deliver"
    id="vframe"
    scrolling="no"
    src="about:blank"
    allowfullscreen=""
    marginwidth="0"
    marginheight="0"
    :style="[styles.frame]"
    frameborder="0" height="470px" width="100%"
    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation"
  >
  </iframe>

</template>

<script>
/**
 * vframe is a wrapper for component
 * If you use vframe with v-pan-zoom, v-picking
 * PLEASE add modifier e.g. v-pan-zoom.vframe=""
 * 
 * For import style to ifrmae this component use a tricky
 * Put `._xeats_` in css or style that will import to iframe
 *
 * ex https://jsfiddle.net/andyyu0920/rfz9rbLs/
 */
import Vue from 'vue'

export default {
  props: {
    width: {
      type: [String, Number],
      required: true
    },
    height: {
      type: [String, Number],
      required: true
    }
  },
  computed: {
    styles () {
      return {
        frame: {
          width: isNaN(+this.width) ? '100%' : `${this.width}px`,
          height: isNaN(+this.height) ? '100%' : `${this.height}px`,
          maxHeight: '100%'
        }
      }
    }
  },
  beforeUpdate () {
    this.app.children = Object.freeze(this.$slots.default)
  },
  methods: {
    deliver () {
      const children = this.$slots.default

      const d = this.$el.contentDocument
      const el = document.createElement('div')
      const styles = document.querySelectorAll('style')

      /**
       * Only import style has ._xeats_ class.
       */
      Array.prototype.forEach.call(styles, function (style) { 
        if (style) {
          if (style.textContent.indexOf('_xeats_') > -1) {
            /**
             * If appendChild directly without clone, 
             * the style will be eat into iframe!
             */
            let cloneStyle = style.cloneNode(true)
            d.body.appendChild(cloneStyle)
          }
        }
      })

      d.body.appendChild(el)
      const vm = new Vue({
        name: 'app',
        data: {
          children: Object.freeze(children)
        },
        render (createElement) {
          return createElement('div', this.children)
        }
      })

      vm.$mount(el)
      this.app = vm

      console.log('styles in deliver', styles)
    }
  },
  beforeCreate(){
    console.log('beforeCreate in vframe')
    console.log('styles', document.querySelectorAll('style'))
  },
  created () {
    console.log('created in vframe')
    console.log('styles', document.querySelectorAll('style'))
  },
  mounted () {
    console.log('mounted in vframe')
    this.deliver()
  }
}
</script>