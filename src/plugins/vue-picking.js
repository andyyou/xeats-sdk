export default {
  install (Vue, options) {
    let pickzone = document.createElement('div')
    pickzone.style.border = '1px dotted #222'
    pickzone.style.position = 'absolute'
    pickzone.hidden = 1

    let begin = {
      x: 0,
      y: 0
    }

    let moveTo = {
      x: 0,
      y: 0
    }

    let offset = {
      x: parseInt(window.getComputedStyle(document.body).marginLeft),
      y: parseInt(window.getComputedStyle(document.body).marginTop)
    }

    function refresh () {
      let xMin = Math.min(begin.x, moveTo.x)
      let xMax = Math.max(begin.x, moveTo.x)
      let yMin = Math.min(begin.y, moveTo.y)
      let yMax = Math.max(begin.y, moveTo.y)
      pickzone.style.left = (xMin - offset.x - 2) + 'px';
      pickzone.style.top = (yMin - offset.y - 2) + 'px';
      pickzone.style.width = xMax - xMin + 'px';
      pickzone.style.height = yMax - yMin + 'px';
    }

    Vue.directive('picking', {
      bind (el, binding, vnode, oldVnode) {
        el.parentElement.appendChild(pickzone)
        el.addEventListener('mousedown', function (e) {
          pickzone.hidden = 0
          begin.x = e.clientX
          begin.y = e.clientY
          refresh()
        }, false)

        el.addEventListener('mousemove', function (e) {
          moveTo.x = e.clientX
          moveTo.y = e.clientY
          refresh()
        }, false)

        el.addEventListener('mouseup', function (e) {
          pickzone.hidden = 1
        }, false)

        
        pickzone.addEventListener('mousemove', function (e) {
          moveTo.x = e.clientX
          moveTo.y = e.clientY
          refresh()
        }, false)

        pickzone.addEventListener('mouseup', function (e) {
          pickzone.hidden = 1
        }, false)
      },
      unbind (el) {
        el.parentElement.removeChild(pickzone)
      }
    })
  }
}