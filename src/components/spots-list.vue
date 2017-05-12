<template>
  <div class='spots-list-panel'>
    <div class='loading' v-if="spotsList.length === 0">
      <div class='line'></div>
      <div class='line'></div>
      <div class='line'></div>
    </div>
    <ul class='spots-list' v-else>
      <li v-for="(spot, index) in spotsList" 
      :key="spot._id"
      :data-spot-id="spot._id"
      @click.prevent.stop="confirmReset($event)"
      >
        {{ spot.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data () {
    return {
      spotsList: []
    }
  },
  methods: {
     confirmReset (e) {
      const reset = window.confirm("This will reset the whole seats. Are you sure to do this?")
            
      if (reset) {
        this.$emit('reset-spot-id', e.target.dataset.spotId)
        console.log('reset-spot-id')    
      } else {
        return
      }
    }
  },
  created () {
    this.$http.get('/spots/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('_x_t')}`
      }
    })
    .then(res => {
      console.log('get spots list', res.data)
      this.spotsList = res.data
    })
    .catch( error => {
      console.log('request error', error)
    })
  }
}
</script>

<style lang="sass" scoped>

  /* _xeats_: Do Not remove this for import in vframe */
  ._xeats_ {position: static;}
  
  .spots-list-panel {
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
  }

  .spots-list {
    margin: 0;
    padding: 0;
    list-style: none;
    // width: 320px;
    max-height: 480px;
    overflow: auto;

    li {
      padding: 8px 10px;
      color: rgba(0, 0, 0, 0.65);
      font-weight: 500;
      font-size: 12px;
      transition: .3s ease;
      cursor: pointer;
      
      &:hover {
            color: #108ee9;
      }

      &+li {
        border-top: 1px solid #ccc;
      }

    }
  }

  .loading {
    min-width: 320px;
    min-height: 180px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .line {
    display: block;
    width: 15px;
    height: 15px;
    border-radius: 15px;
    background-color: #f6b945;
    margin: 0 7px;

    &:nth-last-child(1) {animation: loadingFrames .7s .1s linear infinite;}
    &:nth-last-child(2) {animation: loadingFrames .7s .2s linear infinite;}
    &:nth-last-child(3) {animation: loadingFrames .7s .3s linear infinite;}
  }

  @keyframes loadingFrames {
      0% {transform: translate(0,0);}
      50% {transform: translate(0,15px);}
      100% {transform: translate(0,0);}
  }
</style>