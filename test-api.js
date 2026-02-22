fetch("http://localhost:3000/api/explore", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    // 幸手駅
    currentLat: 36.075,
    currentLng: 139.725,
    radius: 3000,
    placeType: "restaurant",
    direction: "east", // 東方向の店舗に絞り込む
    directionRange: 45, // 左右45度ずつ（合計90度の扇形）
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((error) => console.error("通信エラー:", error));
