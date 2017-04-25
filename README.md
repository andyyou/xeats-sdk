# SDK 

### Usage

1. HTML 中置放標籤

```
<div id="seat-map"></div>
```

2. 加入 sdk 和 script

```html
<script src="dist/sdk.js"></script>
<script>
  (function () {
    var xeat = new Xeat({
      el: '#seat-map',
      accessKey: 'ff5c1d60-ef8d-4284-82c1-35e8be350e34',
      secret: '61b4311e47a8dfce2c0819e95100e95f',
      component: {
        name: 'admin-create', // admin-create | admin-edit | user-booking
        sourceId: '58ef43548095d200324f7e66',
        data: {
          categories: ['A', 'B', 'C', 'D']
        }
      },
      zoomMax: 2,
      zoomMin: 0.5,
      width: 'auto',    // For responsive set value to `auto`
      height: 800,
      amountMax: 4,     // Limit selection amount
      amountMin: 1
    })
  })()
</script>
```


# API

## 讀取座位表
1. 於 xeat.io 申請帳號密碼
2. 取得 `access_key` 和 `secret`
`POST` /v1.0/users/cert
`Content-Type`: application/x-www-form-urlencoded

```js
// POST payload
email: String
password: String
```

```js
// response
{
  "access_key": String,
  "secret": String
}
```

3. 取得 `JWT Token`
`POST` /v1.0/users/token
`Content-Type`: application/x-www-form-urlencoded


```js
// POST BODY
access_key: String
secret: String
```

```js
// response
{
  "token": String
}
```

4. 取得使用者權限下，可取得的場地列表資訊
TODO: 最後要記得鎖上 domain
`GET` /v1.0/spots/

```js
// GET HEADER
Authorization: Bearer <JWT Token>
```

```js
// response
[
  {
    id: ObjectId,   //  source_id (spots_id)
    name: String
  }
]
```

5. 取得特定場地 座位表

`GET` /spots/:id

Table: Spot

```js
{
  // 場地 Id
  id: ObjectId,
  // 場地名稱 e.g. 台北小巨蛋
  name: String, 
  // 原檔尺寸，計算 viewport 縮放使用
  svg: {
    width,
    height
  },
  // API 取值使用
  hash: String
  // 場地設施，物件 e.g. 座位、舞台、殘障席
  objects: [ 
    {
      'node-id': ObjectId
      // 給 API 使用者註記誰取得票價的 hash
      sn: String,
      // 排
      row: Number,
      // 位/號
      column: Number,
      // 文字標記 e.g 4排5號
      label: String,
      // svg x 座標
      x: Number,
      // svg y 座標
      y: Number,
      // 物件類型: 座位、舞台、其他設施、殘障席
      // Enum: seat, stage, facility, disability
      type: String,
      // 座位狀態 :available, :reserved
      status: Number,
      // svg 顏色
      fill: String,
      // svg 形狀寬
      width: Number,
      // svg 形狀高
      height: Number,
      // 鎖，表示該座位不可更新
      lock: Boolean,
      // 備註
      comment: String,
      // 區
      zone: String,
      // 給 API 使用者註記 訂單／訂購者等資訊欄位
      info: Object || Mixed
    },
    // 權限 ['User #1 Id', 'User #2 Id']
    // 預設把建立者的 Id 加入，空陣列任何人都不能 get
    rank: Array
    // 建立者 ID
    user: User
    // 建立時間
    created_at: Date
    // 更新時間
    updated_at: Date
  ]
}
```

## 新增修改座位表
- 修改座位表
`POST` /v1.0/spots

```js
// POST HEADER
{
  Authorization: 'Bearer <token>',
  'Content-Type': 'application/x-www-form-urlencoded'
}
// POST BODY
{
  source_id: String, // required, <spots_id>
  seats: Array,      // required, information to update seats, {node_id: '', type: '', fill: '', category: ''}
  start_at: String,  // ISO-8601, 2017-04-24T04:13:45+00:00, or 2017-04-24T04:13:45Z
  end_at: String,    // ISO-8601
  name: String       // 座位表顯示名稱，例如小巨蛋
}
```

___

> 實際訂位購票 修改的資料

`GET` /seats
`POST` /seats
`PUT` /seats/:id
`PUT` /seats/:id/:seat_id

Table: Seat

```js
{
  // 單場訂位活動名稱 e.g. 張學友演唱會
  name: String,
  // 場地名稱 copy from spot
  spot_name: String,
  objects: [
    {
      'node-id': ObjectId
      // 給 API 使用者註記誰取得票價的 hash
      sn: String,
      // 排
      row: Number,
      // 位/號
      column: Number,
      // 文字標記 e.g 4排5號
      label: String,
      // svg x 座標
      x: Number,
      // svg y 座標
      y: Number,
      // 物件類型: 座位、舞台、其他設施、殘障席
      // Enum: seat, stage, facility, disability
      type: String,
      // 座位狀態 :available, :reserved
      status: Number,
      // svg 顏色
      fill: String,
      // svg 形狀寬
      width: Number,
      // svg 形狀高
      height: Number,
      // 鎖，表示該座位不可更新
      lock: Boolean,
      // 備註
      comment: String,
      // 區
      zone: String,
      // 給 API 使用者註記 訂單／訂購者等資訊欄位
      info: Object || Mixed
    }
  ],
  spot: Spot,
  user: User,
  public: Boolean,
  created_at: Date,
  updated_at: Date
}
```


# SVG 筆記

* svg 由 W3C 所制定，基於 xml 定義向量圖
* 在 Illustrator 圖層是上蓋下，但在 svg xml 程式中是後蓋前
* 在 svg 中圖層等於 `<g>` 無法控制位置、形狀，單純就是 group 元素
* `<g>` 的 id 等於圖層名稱，在編輯軟體中如果圖層名稱重複則編輯軟體會自動補上 affix

# Todos

* [x] Seat hover show text with information
* [x] Home button (rest map to center)
* [ ] Limit drag svg only show map
* [ ] Zoom in out for mobile
* [x] Plus button (zoom in)
* [x] Minus button (zoom out)
* [ ] Event and append elements for after selectd seat call API
* [ ] Get seat map and data from API
* [x] Click to select seats
* [x] Limit selection quanity
* [x] Zoom in out
* [x] Remove `autoSize`

# Changelog

* `2017-03-24` 根據 API 修改文件與 v-pan-zoom 變數名稱
* `2017-03-21` 完成基本 zoom in out 與 選票功能
