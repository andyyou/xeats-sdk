<template>
  <div>
    <input type='date' required pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
    v-if="useNative"
    class="inputStyle"
    :style="inputStyle"
    :min="options.minYear + '-01-01'"
    :max="options.maxYear + '-12-31'"
    :value="datePicked"
    @change="userChangeDate($event)"
    >

    <div
    v-if="!useNative"
    >
      <select
      v-model="year"
      >
        <option disabled value="">年</option>
        <option
        v-for="year in yearOptions"
        :value="year"
        >{{ year }}</option>
      </select>

       <select
      v-model="month"
      >
        <option disabled value="">月</option>
        <option
        v-for="month in monthOptions"
        :value="month"
        >{{ month }}</option>
      </select>

      <select
      v-model="day"
      >
        <option disabled value="">日</option>
        <option
        v-for="day in dayOptions"
        :value="day"
        >{{ day }}</option>
      </select>

      <input type="hidden" :value="datePicked">
    </div>
  </div>
</template>

<script>
export default {
   props: {
    maxYear: {
      type: Number,
      default: function () {
        return new Date().getFullYear() + 5   // 預設最大年限為今年往後算 5 年
      }
    },
    minYear: {
      type: Number,
      default: function () {
        return new Date().getFullYear() - 5   // 預設最小年限為今年往後算 5 年
      }
    },
    inputStyle: {
      type: Object
    },
    datePickerOption: {
      type: String
    }
  },
  data () {
    return {
      day: '',
      month: '',
      year: '',
      monthOptions: [],
      yearOptions: [],
      options: {
        maxYear: this.maxYear,
        minYear: this.minYear,
        today: ''
      },
      useNative: true
    }
  },
  watch: {
    // This is to update setDate for props
    datePickerOption (value) {
      console.log('datePickerOption', value)
      if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/.test(value)) {
        let date = value.split('T')[0]
        this.year = date.split('-')[0]
        this.month = date.split('-')[1]
        this.day = date.split('-')[2]
      }
    }
  },
  computed: {
    datePicked () {
      return `${this.year}-${this.month}-${this.day}`
    },
    dayOptions: {
      get () {
        let dayOptions = []
        let dayNumber
        let month = this.month
        let year = this.year

        if (month === '01' | month === '03' | month === '05' | month === '07' | month === '08' | month === '10' | month === '12') {
          dayNumber = 31
        } else if (month === '04' | month === '06' | month === '09' | month === '11') {
          dayNumber = 30
        } else {
        // If month is February, calculate whether it is a leap year or not
          (year - 2016) % 4 === 0 ? dayNumber = 29 : dayNumber = 28
        }

        for (let i = 1; i <= dayNumber; i++) {
          let dayToString = i.toString()
          dayOptions.push(dayToString.padStart(2, '0'))
        }

        // 這是用來修正日期，如果使用者先選日，在選月，而該月其實沒有該月份
        while (!dayOptions.includes(this.day.toString())) {
          this.day -= 1
        }

        return dayOptions
      }

    }
  },
  methods: {
    userChangeDate (event) {
      console.log('userChangeDate', event)
      // 判斷 value 是否存在，若 value 不存在表示使用者輸入無效的日期
      if (event.target.value) {
        let pickDay = event.target.value.split('-')
        this.year = pickDay[0]
        this.month = pickDay[1]
        this.day = pickDay[2]
        console.log('refresh-date', this.datePicked)
        this.$emit('refresh-date', this.datePicked)
      }
    }
  },
  created () {
    let isNativeSupport = document.createElement('input')
    isNativeSupport.type = 'date'

    // 初始化 Native Picker
    let today = new Date()

    this.options.today = today.toISOString().split('T')[0]

    // 如果沒有指定日期，則預設顯示今天
    this.year = this.options.today.split('-')[0]
    this.month = this.options.today.split('-')[1]
    this.day = this.options.today.split('-')[2]


    console.log('refresh-date', this.datePicked)
    this.$emit('refresh-date', this.datePicked)
    

    if (isNativeSupport.type === 'text') {
      this.useNative = false

      // 設定可選月份
      for (let i = 1; i <= 12; i++) {
        let monthToString = i.toString()
        this.monthOptions.push(monthToString.padStart(2, '0'))
      }

      // 設定可選年份
      for (let i = this.options.minYear; i <= this.options.maxYear; i++) {
        this.yearOptions.push(i.toString())
      }
    }
  }
}
</script>

<style lang="sass" scoped>
  .inputStyle{
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
</style>
