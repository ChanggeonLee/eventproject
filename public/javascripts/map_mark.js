var mapContainer = document.getElementById('map'), // 지도를 표시할 div
mapOption = {
  center: new daum.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
  level: 3 // 지도의 확대 레벨
};
var map = new daum.maps.Map(mapContainer, mapOption); // 지도를 생성합니다
// 마커를 표시할 위치입니다
var position =  new daum.maps.LatLng(33.450701, 126.570667);
// 마커를 생성합니다
var marker = new daum.maps.Marker({
position: position
});
// 마커를 지도에 표시합니다.
marker.setMap(map);
// 마커에 커서가 오버됐을 때 마커 위에 표시할 인포윈도우를 생성합니다
var iwContent = '<div style="padding:5px;">Hello World!</div>'; // 인포윈도우에 표출될 내용으로 HTML 문자열이나 document element가 가능합니다
// 인포윈도우를 생성합니다
var infowindow = new daum.maps.InfoWindow({
content : iwContent
});
// 마커에 마우스오버 이벤트를 등록합니다
daum.maps.event.addListener(marker, 'mouseover', function() {
// 마커에 마우스오버 이벤트가 발생하면 인포윈도우를 마커위에 표시합니다
infowindow.open(map, marker);
});
// 마커에 마우스아웃 이벤트를 등록합니다
daum.maps.event.addListener(marker, 'mouseout', function() {
// 마커에 마우스아웃 이벤트가 발생하면 인포윈도우를 제거합니다
infowindow.close();
});