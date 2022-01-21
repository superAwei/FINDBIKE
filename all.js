
// 初始化物件備用
let stationData = [];
let filterData = [];

// 選取會用到的 DOM 元素
let list = document.querySelector(".list");
// 選取定位
let myPos = document.querySelector(".myPos");

//切換地圖按鈕
let switchMap = document.querySelector("#switch");
// 建立一個地圖變數
let map,lat,lon;
// 設定固定時間呼叫一次 API
let updateAPI;

// 建立變換地圖樣式
let Mapid = "mapbox/dark-v10";
// 建立更換地圖變數
let MapType ="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}";


const tileLayer = L.tileLayer(MapType, {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: Mapid,
    tileSize: 512,
    zoomOffset: -1,
    accessToken:
      "pk.eyJ1IjoiYXdlaTE5ODgiLCJhIjoiY2t3OWJ1NHMwMG1zNjJuczN1cHJ1eTM3MyJ9.qnF6bc7O5WUySnldppAtew"
});
let flag = false;

switchMap.addEventListener("click", function () {
  console.log('123')
    if (!flag) {
      tileLayer.setUrl(
        "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token={accessToken}"
      );
      flag = !flag;
    } else {
      flag = !flag;
      tileLayer.setUrl(
        "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
      );
    }
});
// 點擊定位點回到目前位置
myPos.addEventListener('click',function(){
    // 重新設定地圖位置，為目前所在位置座標
    map.setView([lat, lon], 16);
})


//初始化網頁
function init() {
  getLocation();
}
init();

//抓目前自己的所在位置
function getLocation() {
  navigator.geolocation.getCurrentPosition(function (position) {
    //抓緯度
     lat = position.coords.latitude;
    //抓經度
     lon = position.coords.longitude;
    getstationinfo(lat, lon);
    // 載入 mapbox 地圖
    initMap(lat, lon);
  });
}

//把 mapbox 地圖抓進來寫 mapbox 載入地圖函式
function initMap(lat, lon) {
  map = L.map("map").setView([lat, lon], 16);
  tileLayer.addTo(map);
  // L.tileLayer(
  //   "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
  //   {
  //     attribution:
  //       'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  //     maxZoom: 18,
  //     id: "mapbox/dark-v10",
  //     tileSize: 512,
  //     zoomOffset: -1,
  //     accessToken:"pk.eyJ1IjoiYXdlaTE5ODgiLCJhIjoiY2t3OWJ1NHMwMG1zNjJuczN1cHJ1eTM3MyJ9.qnF6bc7O5WUySnldppAtew"
  //   }
  // ).addTo(map);

  
  // 顯示目前自己所在位置並客製化 icon
  var myIcon = L.divIcon({
    className: 'circle',
    iconSize:20,
    html:`<div class="circle">
    <div class="pos"></div>
  </div>`
  });
  L.marker([lat, lon], { icon: myIcon })
    .addTo(map)
    .bindPopup("<h1 class='mylocation'>我的位置</h1>")
    .openPopup();
  map.on("moveend", function (ev) {
    console.log(map.getCenter());
  });

}



 // 客製化車站 icon
 const customStationIcon = new L.Icon({
  iconUrl:
    "img/bikeIcon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [26, 36],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [40, 40],
  shadowAnchor: [8, 50]
});


// 先去抓個縣市站點名稱
function getstationinfo(lat, lon) {
  axios
    .get(
      `https://ptx.transportdata.tw/MOTC/v2/Bike/Station/NearBy?%24spatialFilter=nearby(${lat}%2C%20${lon}%2C%201000)&%24format=JSON`,
      {
        headers: getAuthorizationHeader()
      }
    )
    .then(function (response) {
      stationData = response.data;
      getavailableinfo(lat, lon);
       //可以自行設定秒數，單位是毫秒
       updateAPI = setInterval(() => getavailableinfo(lat, lon), 360000);
    });
}

// 再去接每個車站點的車位資訊
function getavailableinfo(lat, lon) {
  filterData = [];
  axios
    .get(
      `https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/NearBy?%24spatialFilter=nearby(${lat}%2C%20${lon}%2C%201000)&%24format=JSON`,
      {
        headers: getAuthorizationHeader()
      }
    )
    .then(function (response) {
      const availableData = response.data;
      availableData.forEach(function (availableitem) {
        stationData.forEach(function (stationitem) {
          if (availableitem.StationUID == stationitem.StationUID) {
            let obj = {};
            obj.StationUID = availableitem.StationUID;
            obj.name = stationitem.StationName.Zh_tw;
            obj.rent = availableitem.AvailableRentBikes;
            obj.return = availableitem.AvailableReturnBikes;
            // 取出 API 中的經緯度塞到物件中
            obj.poslon = stationitem.StationPosition.PositionLon;
            obj.poslat = stationitem.StationPosition.PositionLat;
            filterData.push(obj);
          }
        });
      });
      // 把資料印在地圖上面
      // 把圖標都放在每個座標上
      filterData.forEach(function (item) {
        L.marker([item.poslat, item.poslon], { icon: customStationIcon })
        .addTo(map)
        .bindPopup(`
        <h3 class="info_name">${item.name}</h3>
          <ul class="info_card">
            <li class="info_card_item">可租借車輛<span class="info_card_num">${item.rent}</span></li>
            <li class="info_card_item">可歸還車位<span class="info_card_num">${item.return}</span></li>
          </ul>
          <a class="navigation" href="https://www.google.com.tw/maps/place/${item.poslat},${item.poslon}" target="_blank"><span class="material-icons">
          near_me
          </span>開始導航</a>
       `)
        // 加上這一段可以讓圖標飛躍移動
        .on('click', () => {
        map.flyTo([item.poslat,item.poslon])
        });
      });
    });
}

// 做一個渲染的函式
// function render() {
//   let str = "";
//   filterData.forEach(function (item) {
//     str += `<li>${item.name}，可租${item.rent}個車位，可還剩餘${item.return}個車位
//         <a href="https://www.google.com.tw/maps/place/${item.poslat},${item.poslon}" target="_blank">開始導航</a></li>
//         `;
//     // 把 google 叫出導航的網址替換掉裡面的經緯度，後放到 a 連結中
//   });
//   list.innerHTML = str;
// }
// render();
// API 驗證機制
function getAuthorizationHeader() {
  //  填入自己 ID、KEY 開始
  let AppID = "7bf093812cc647ef88f96eb80ed11205";
  let AppKey = "hsvZ4rE55Ftt5AqEoVoitI3SqjQ";
  //  填入自己 ID、KEY 結束
  let GMTString = new Date().toGMTString();
  let ShaObj = new jsSHA("SHA-1", "TEXT");
  ShaObj.setHMACKey(AppKey, "TEXT");
  ShaObj.update("x-date: " + GMTString);
  let HMAC = ShaObj.getHMAC("B64");
  let Authorization =
    'hmac username="' +
    AppID +
    '", algorithm="hmac-sha1", headers="x-date", signature="' +
    HMAC +
    '"';
  return { Authorization: Authorization, "X-Date": GMTString };
}
