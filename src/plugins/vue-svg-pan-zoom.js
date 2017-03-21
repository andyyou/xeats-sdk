import Rx from 'rxjs'

export default {
  install (Vue, options) {
    /**
     * elements of svg moving ability
     */
    Vue.directive('pan-zoom', {
      bind (el, binding, vnode, oldVnode) {
        /**
         * Draggable svg
         */
        const mousedown = Rx.Observable.fromEvent(el, 'mousedown')
        const mousemove = Rx.Observable.fromEvent(el, 'mousemove')
        const mouseup = Rx.Observable.fromEvent(document, 'mouseup')

        const touchstart = Rx.Observable.fromEvent(el, 'touchstart')
        const touchmove = Rx.Observable.fromEvent(el, 'touchmove')
        const touchcancel = Rx.Observable.fromEvent(el, 'touchcancel')
        const touchend = Rx.Observable.fromEvent(document, 'touchend')
        
        const dragStart = Rx.Observable.merge(mousedown, touchstart)
        const dragMove = Rx.Observable.merge(mousemove, touchmove)
        const dragEnd = Rx.Observable.merge(mouseup, touchcancel, touchend)
        
        let svg = el

        const drag = dragStart.map((e) => {
          e.preventDefault()

          // If click on elements in svg do NOT handle 
          if (e.currentTarget.tagName !== 'svg') {
            return Rx.Observable.empty()
          }

          // Only handle one touch
          if (e.touches && e.touches.length > 1) {
            return Rx.Observable.empty()
          }

          /**
           * Current Transformation Matrix
           * 
           * http://stackoverflow.com/questions/10298658/mouse-position-inside-autoscaled-svg
           */

          let startPoint = svg.createSVGPoint()
          let ctm = svg.getScreenCTM()
          const prevPoint = {
            x: vnode.context[binding.expression].x,
            y: vnode.context[binding.expression].y
          }

          // Mouse point of browser window
          if (e.touches) {
            startPoint.x = e.touches[0].clientX
            startPoint.y = e.touches[0].clientY
          } else {
            startPoint.x = e.clientX
            startPoint.y = e.clientY
          }

          startPoint = startPoint.matrixTransform(ctm.inverse())

          return dragMove.observeOn(Rx.Scheduler.animationFrame).map((e) => {
            let moveToPoint = svg.createSVGPoint()

            if (e.touches) {
              moveToPoint.x = e.changedTouches[0].clientX
              moveToPoint.y = e.changedTouches[0].clientY
            } else {
              moveToPoint.x = e.clientX
              moveToPoint.y = e.clientY
            }
            moveToPoint = moveToPoint.matrixTransform(ctm.inverse())

            return {
              x: prevPoint.x + (startPoint.x - moveToPoint.x),
              y: prevPoint.y + (startPoint.y - moveToPoint.y)
            }
          }).takeUntil(dragEnd)
        }).switch()

        drag.subscribe((p) => {
          vnode.context[binding.expression].x = p.x 
          vnode.context[binding.expression].y = p.y
        })

        /**
         * Zoom in out
         */
        const wheel = 'onwheel' in document ? 'wheel' : 'mousewheel'
        const zoom = Rx.Observable.fromEvent(el, wheel)
        let scale = 1

        zoom.subscribe((e) => {
          e.preventDefault()
          e.stopPropagation()
          requestAnimationFrame(() => {
            let viewport = {
              width: svg.getBoundingClientRect().width,
              height: svg.getBoundingClientRect().height
            }

            let tmp = scale + (e.deltaY / 100)
            if (tmp >= vnode.context[binding.expression].zoomMax) {
              tmp = vnode.context[binding.expression].zoomMax
            }
            if (tmp <= vnode.context[binding.expression].zoomMin) {
              tmp = vnode.context[binding.expression].zoomMin
            }
            scale = tmp

            // Mouse or touch point
            let offsetPoint = svg.createSVGPoint()
            let ctm = svg.getScreenCTM()

            if (e.touches && e.touches.length > 1) {
              offsetPoint.x = e.changedTouches[0].clientX
              offsetPoint.y = e.changedTouches[0].clientY
            } else {
              offsetPoint.x = e.clientX
              offsetPoint.y = e.clientY
            }

            // Get svgOffsetPoint position，mouse or touch point relative to origin point of SVG 
            let svgOffsetPoint = offsetPoint.matrixTransform(ctm.inverse())
            let viewBox = svg.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
            svg.setAttribute('viewBox', `${viewBox[0] + svgOffsetPoint.x} ${viewBox[1] + svgOffsetPoint.y} ${viewport.width * scale} ${viewport.height * scale}`)

            vnode.context[binding.expression].width = viewport.width * scale
            vnode.context[binding.expression].height = viewport.height * scale

            /**
             * svgScaledPoint: The same point but different unit
             * mains will get scaled unit in svg
             */
            let svgScaledPoint = offsetPoint.matrixTransform(svg.getScreenCTM().inverse())
            viewBox = svg.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
            let movement = {
              x: viewBox[0] + (svgOffsetPoint.x - svgScaledPoint.x),
              y: viewBox[1] + (svgOffsetPoint.y - svgScaledPoint.y)
            }
            svg.setAttribute('viewBox', `${movement.x} ${movement.y} ${viewBox[2]} ${viewBox[3]}`)

            vnode.context[binding.expression].x = movement.x
            vnode.context[binding.expression].y = movement.y
          })
          
        })

        /**
         * TODO: touch for Zoom in out
         */
      }
    })
  }
}