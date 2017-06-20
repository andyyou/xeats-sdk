import Hammer from 'hammerjs'
import 'hammer-timejs'

export default {
  install (Vue, options) {
    let onZoom, onPinchEnd, onPanStart, onPanMove, onPanEnd
    let mc
    Vue.directive('pan-zoom', {
      bind (el, binding, vnode, oldVnode) {
        let panning, startViewBox
        let svgElement = el

        let startScale
        let currentScale

        // Create Manager
        if (binding.modifiers.vframe) {
          mc = new Hammer.Manager(document.querySelector('#vframe').contentWindow.document.body)
        } else {
          mc = new Hammer.Manager(svgElement)
        }
        // Create Recognizer
        const pinch = new Hammer.Pinch({domEvents: true})
        const pan = new Hammer.Pan({domEvents: true})
        pinch.requireFailure(pan)

        mc.add([pinch, pan])

        onPanStart = function () {
          panning = true
          startViewBox = svgElement.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
        }

        onPanMove = function (e) {
          if (panning) {
            let startPoint = svgElement.createSVGPoint()
            let ctm = svgElement.getScreenCTM()

            startPoint.x = e.changedPointers[0].clientX
            startPoint.y = e.changedPointers[0].clientY
            startPoint = startPoint.matrixTransform(ctm.inverse())

            let moveToPoint = svgElement.createSVGPoint()
            moveToPoint.x = e.changedPointers[0].clientX + e.deltaX
            moveToPoint.y = e.changedPointers[0].clientY + e.deltaY
            moveToPoint = moveToPoint.matrixTransform(ctm.inverse())

            let movement = {
              x: startViewBox[0] + (startPoint.x - moveToPoint.x),
              y: startViewBox[1] + (startPoint.y - moveToPoint.y)
            }

            let moveToViewBox = `${movement.x} ${movement.y} ${startViewBox[2]} ${startViewBox[3]}`
            svgElement.setAttribute('viewBox', moveToViewBox)

            vnode.context[binding.expression].x = movement.x
            vnode.context[binding.expression].y = movement.y
          }
        }

        onPanEnd = function () {
          panning = false
        }

        onZoom = function (e) {
          e.preventDefault()

          startViewBox = svgElement.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
          let startPoint = svgElement.createSVGPoint()
          let ctm = svgElement.getScreenCTM()

          if (e.type === 'wheel') {
            startPoint.x = e.clientX
            startPoint.y = e.clientY
          } else if (e.type === 'pinchmove') {
            startPoint.x = e.center.x
            startPoint.y = e.center.y
          } else {
            console.warn('Event not support')
          }
          let svgStartPoint = startPoint.matrixTransform(ctm.inverse())

          // Scaled
          let viewport = {
            width: svgElement.getBoundingClientRect().width,
            height: svgElement.getBoundingClientRect().height
          }

          let scaleRange = vnode.context[binding.expression].scaleRange
          startScale = vnode.context[binding.expression].scale
          if (e.type === 'wheel') {
            currentScale = startScale + (e.deltaY / 100)

            if (currentScale >= scaleRange.maxScale) {
              currentScale = scaleRange.maxScale
            } else if (currentScale <= scaleRange.minScale) {
              currentScale = scaleRange.minScale
            }
            vnode.context[binding.expression].scale = currentScale
          } else if (e.type === 'pinchmove') {
            currentScale = startScale * (1 / e.scale)

            if (currentScale >= scaleRange.minSize) {
              currentScale = scaleRange.minSize
            } else if (currentScale <= scaleRange.maxSize) {
              currentScale = scaleRange.maxSize
            }
          } else {
            console.warn('Not handle event')
          }

          svgElement.setAttribute('viewBox', `${startViewBox[0]} ${startViewBox[1]} ${viewport.width * currentScale} ${viewport.height * currentScale}`)
          vnode.context[binding.expression].width = viewport.width * currentScale
          vnode.context[binding.expression].height = viewport.height * currentScale

          // moveBack
          ctm = svgElement.getScreenCTM()
          let svgScaledPoint = startPoint.matrixTransform(ctm.inverse())
          let scaledViewBox = svgElement.getAttribute('viewBox').split(' ').map(n => parseFloat(n))

          let movement = {
            x: scaledViewBox[0] + (svgStartPoint.x - svgScaledPoint.x),
            y: scaledViewBox[1] + (svgStartPoint.y - svgScaledPoint.y)
          }

          svgElement.setAttribute('viewBox', `${movement.x} ${movement.y} ${scaledViewBox[2]} ${scaledViewBox[3]}`)
          vnode.context[binding.expression].x = movement.x
          vnode.context[binding.expression].y = movement.y
        }

        onPinchEnd = function (e) {
          vnode.context[binding.expression].scale = currentScale
          mc.off('pan')
          setTimeout(mc.on('pan'), 500)
        }

        mc.on('pinchstart', () => {})
        mc.on('pinchmove', onZoom)
        mc.on('pinchend', onPinchEnd)
        mc.on('panstart', onPanStart)
        mc.on('panmove', onPanMove)
        mc.on('panend', onPanEnd)
        if (!binding.modifiers['disable-wheel']) {
          el.addEventListener('wheel', onZoom, false)
        }
      },
      unbind (el, binding, vnode, oldVnode) {
        mc.off('pinchstart', () => {})
        
        if (!binding.modifiers['disable-wheel']) {
          mc.off('pinchmove', onZoom)
        }
        mc.off('pinchend', onPinchEnd)
        mc.off('panstart', onPanStart)
        mc.off('panmove', onPanMove)
        mc.off('panend', onPanEnd)
        mc.off('pan')
        mc.off('pinch')
        if (!binding.modifiers['disable-wheel']) {
          el.removeEventListener('wheel', onZoom)
        }
      }
    })
  }
}
