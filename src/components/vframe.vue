<template>

  <iframe
    @load="deliver"
    scrolling="no"
    src="about:blank"
    allowfullscreen=""
    :style="[styles.frame]"
    frameborder="0" height="470px" width="100%"
    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation"
  >
  </iframe>

</template>

<script>
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
      console.log(this.$el.contentDocument)

      const d = this.$el.contentDocument
      const el = document.createElement('div')
      const styles = document.querySelectorAll('style')

      /**
       * Only import style has _xeats_ comment.
       */
      Array.prototype.forEach.call(styles, function (style) {
        if (style) {
          if (style.textContent.indexOf('_xeats_') > -1) {
            d.body.appendChild(style)
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
    }
  }
}
</script>
