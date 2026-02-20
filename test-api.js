fetch("http://localhost:3000/api/explore", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    // 幸手駅
    currentLat: 36.075,
    currentLng: 139.725,
    radius: 1000,
    placeType: "restaurant",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((error) => console.error("通信エラー:", error));
