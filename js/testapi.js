const API_URL = 'http://localhost:3000/api/stadiums';

// Hàm lấy dữ liệu từ API
// async function fetchStadiums() {
//   try {
//     const response = await fetch(API_URL);
//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }
//     const data = await response.json();
//     console.log(data);
//     displayStadiums(data); // Gọi hàm hiển thị (tùy thuộc frontend của bạn)
//   } catch (error) {
//     console.error('Lỗi khi lấy dữ liệu:', error);
//   }
// }

// // Hàm hiển thị dữ liệu (ví dụ)
// function displayStadiums(stadiums) {
//   stadiums.forEach(stadium => {
//     console.log(`Tên sân: ${stadium.name}, Giá: ${stadium.price}, Loại: ${stadium.sport_type}`);
//   });
// }

// // Gọi hàm để lấy dữ liệu
// fetchStadiums();

let fallbackStadiums = [
    {
        "id": 1,
        "owner_id": 1,
        "name": "San Van Dong A",
        "description": "San co chat luong cao",
        "location": "456 Duong XYZ, Quan 3",
        "district": "Quan 3",
        "price": "500000.00",
        "capacity": 100,
        "sport_type": "football",
        "is_active": true,
        "featured": false
    },
    {
        "id": 2,
        "owner_id": 1,
        "name": "San Van Dong B",
        "description": "San nho phu hop cho nhom ban be",
        "location": "123 Duong ABC, Quan 1",
        "district": "Quan 1",
        "price": "350000.00",
        "capacity": 50,
        "sport_type": "basketball",
        "is_active": true,
        "featured": true
    },
    {
        "id": 3,
        "owner_id": 2,
        "name": "San Tennis Quan 7",
        "description": "San tennis chat luong cao",
        "location": "789 Duong DEF, Quan 7",
        "district": "Quan 7",
        "price": "200000.00",
        "capacity": 4,
        "sport_type": "tennis",
        "is_active": true,
        "featured": false
    },
    {
        "id": 4,
        "owner_id": 2,
        "name": "San Tennis Thu Duc",
        "description": "San tennis chat luong cao",
        "location": "789 Duong DEF, Thu Duc",
        "district": "Thu Duc",
        "price": "10",
        "capacity": 4,
        "sport_type": "tennis",
        "is_active": true,
        "featured": false
    }
];
async function fetchTest() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      fallbackStadiums = await response.json();
      console.log(fallbackStadiums);
      //displayStadiums(data); // Gọi hàm hiển thị (tùy thuộc frontend của bạn)
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    }
  }
fetchTest();