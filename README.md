# Wanderly — Mạng xã hội nhật ký du lịch

**Bài tập lớn môn Lập trình Web**  
**Mã lớp:** RIPT1306-20261-03 · **Nhóm:** 11

Wanderly là ứng dụng web chia sẻ trải nghiệm và nhật ký du lịch. Người dùng có thể tạo tài khoản, đăng bài về chuyến đi, tương tác với bài viết, theo dõi người dùng khác và quản lý hồ sơ cá nhân.

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 19, Vite 8, React Router, Redux Toolkit, Tailwind CSS, Axios, Lucide React |
| Backend | Node.js (>=22), Express 5 |
| Cơ sở dữ liệu | MongoDB, Mongoose |
| Xác thực | JWT, bcryptjs |
| Lưu trữ ảnh | Cloudinary; Multer xử lý tải tệp |
| Kiểm thử backend | Node.js Test Runner, Supertest, mongodb-memory-server |

## 2. Chức năng chính

- Đăng ký, đăng nhập, đăng xuất và quản lý phiên đăng nhập.
- Tạo và xem bài viết nhật ký du lịch; chỉnh sửa bài viết.
- Quản lý trang cá nhân, cập nhật thông tin và đổi mật khẩu.
- Theo dõi người dùng và tương tác với bài viết.
- Xem thông báo.
- Hỗ trợ tải ảnh cho nội dung du lịch.

> Các chức năng hiển thị và quyền truy cập có thể thay đổi theo phiên bản mã nguồn đang triển khai. Hãy kiểm thử trực tiếp trước khi trình bày hoặc nghiệm thu.

## 3. Yêu cầu môi trường

- Node.js **22 trở lên** và npm.
- MongoDB Atlas (hoặc MongoDB local đã được cấu hình phù hợp).
- Thông tin cấu hình Cloudinary nếu sử dụng tính năng tải ảnh.
- Git và trình duyệt web hiện đại.

## 4. Tải mã nguồn

```bash
git clone https://github.com/lehongphuptit/RIPT1306-20261-03_11_LTW_CuoiKy.git
cd RIPT1306-20261-03_11_LTW_CuoiKy
```

Cấu trúc chính:

```text
RIPT1306-20261-03_11_LTW_CuoiKy/
├── client/                  # React + Vite
│   ├── src/
│   └── package.json
├── server/                  # Express + MongoDB
│   ├── src/
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## 5. Cấu hình Backend

Mở Terminal tại thư mục `server`:

```bash
cd server
npm install
```

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Mở `server/.env` và cấu hình mỗi biến trên **một dòng**:

```dotenv
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster-host>/<database>
JWT_SECRET=<chuoi_ngau_nhien_toi_thieu_32_ky_tu>
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:3086
TRUST_PROXY=0
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
ADMIN_EMAIL=<admin_email>
ADMIN_PASSWORD=<admin_password>
ADMIN_USERNAME=admin
DEMO_EMAIL=
DEMO_PASSWORD=
```

**Lưu ý cấu hình:**

- `MONGO_URI`: chuỗi kết nối do người quản lý MongoDB Atlas cấp. IP public của máy chạy Backend phải được cho phép trong **Atlas → Network Access**.
- `JWT_SECRET`: chuỗi ngẫu nhiên dài ít nhất 32 ký tự.
- `CLIENT_URL`: danh sách nguồn truy cập Frontend được cho phép.
- Các biến `CLOUDINARY_*` cần thiết khi dùng chức năng ảnh trên Cloudinary.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`: dùng khi tạo tài khoản quản trị bằng lệnh seed.
- `DEMO_EMAIL` và `DEMO_PASSWORD`: tùy chọn; chỉ cần điền khi muốn tạo tài khoản demo.
- **Không commit file `.env` lên GitHub.** Chỉ đưa `.env.example` với giá trị mẫu lên repository.

## 6. Khởi chạy dự án

Cần **hai Terminal** chạy song song.

### 6.1. Terminal 1 — Backend

```bash
cd server
npm run dev
```

Nếu thành công, Terminal hiển thị thông báo tương tự:

```text
Travel Diary API listening on port 5000
```

Backend mặc định chạy tại `http://localhost:5000`.

### 6.2. Terminal 2 — Frontend

Mở Terminal mới từ thư mục gốc dự án:

```bash
cd client
npm install
npm run dev
```

Mở địa chỉ được Vite hiển thị trong Terminal, thường là:

```text
http://localhost:5173
```

Cấu hình Vite hiện tại chuyển tiếp các request `/api` sang `http://127.0.0.1:5000`.

> Nếu Terminal đang ở thư mục `server`, dùng `cd ../client` để chuyển sang Frontend.

## 7. Tạo dữ liệu ban đầu (Seed)

Tại thư mục `server`, sau khi cấu hình `.env` và MongoDB:

```bash
npm run seed
```

Script seed hiện tại:

- Tạo **admin gốc** từ `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME` nếu chưa có admin gốc và không trùng tài khoản.
- Không tự nâng quyền tài khoản đã tồn tại.
- Nếu có đủ `DEMO_EMAIL` và `DEMO_PASSWORD`, tạo tài khoản demo `travel_demo` khi chưa tồn tại, đồng thời tạo bài viết mẫu về Hội An nếu tài khoản chưa có bài viết.
- Nếu để trống hai biến `DEMO_*`, phần tạo tài khoản demo được bỏ qua.

**Không chạy seed trên cơ sở dữ liệu dùng chung khi chưa được người quản lý Backend đồng ý.**

## 8. Tài khoản kiểm thử

| Vai trò | Cách tạo / sử dụng |
|---|---|
| Người dùng thông thường | Đăng ký trực tiếp trên giao diện |
| Quản trị viên | Được tạo bằng `npm run seed` từ các biến `ADMIN_*` |
| Người dùng demo (tùy chọn) | Được tạo bằng `npm run seed` khi cấu hình `DEMO_EMAIL` và `DEMO_PASSWORD` |

Không công khai mật khẩu thật trong README. Giảng viên có thể nhận tài khoản demo qua kênh riêng hoặc theo hướng dẫn của nhóm.

## 9. Kiểm thử

### 9.1. Kiểm thử tự động Backend

```bash
cd server
npm test
```

### 9.2. Kiểm tra chất lượng Frontend

```bash
cd client
npm run lint
npm run build
```

### 9.3. Kiểm thử thủ công đề xuất

1. Đăng ký hai tài khoản người dùng A và B.
2. Đăng nhập A, tạo bài viết có ảnh.
3. Chuyển quyền hiển thị sang **chỉ người theo dõi** (nếu tùy chọn này có trong giao diện hiện tại).
4. Đăng nhập B, kiểm tra khả năng xem bài trước và sau khi theo dõi A.
5. Dùng B tương tác với bài viết, kiểm tra thông báo trên tài khoản A.
6. Kiểm tra trang cá nhân, cập nhật hồ sơ và đổi mật khẩu.

Ghi nhận kết quả thực tế và lỗi phát sinh; không coi danh sách trên là bằng chứng các ca kiểm thử đã thành công.

## 10. Các lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
|---|---|
| `Cần MONGO_URI và JWT_SECRET...` | Kiểm tra `server/.env`, lưu file và đảm bảo `JWT_SECRET` có ít nhất 32 ký tự |
| `Không kết nối được MongoDB` | Kiểm tra URI, trạng thái Atlas, Network Access, tài khoản database và kết nối mạng |
| Frontend không gọi được API | Đảm bảo Backend đang chạy ở cổng 5000 và kiểm tra proxy trong `client/vite.config.js` |
| Không tải được ảnh | Kiểm tra cấu hình Cloudinary và quyền truy cập |
| Cổng đã được sử dụng | Dừng tiến trình cũ hoặc điều chỉnh cổng và cấu hình liên quan |

## 11. Lệnh hữu ích

| Thư mục | Lệnh | Mục đích |
|---|---|---|
| `client` | `npm run dev` | Chạy Frontend ở chế độ phát triển |
| `client` | `npm run build` | Build Frontend |
| `client` | `npm run preview` | Xem bản build |
| `client` | `npm run lint` | Kiểm tra ESLint |
| `server` | `npm run dev` | Chạy Backend với Node watch |
| `server` | `npm start` | Chạy Backend |
| `server` | `npm run seed` | Tạo dữ liệu ban đầu |
| `server` | `npm test` | Chạy test Backend |

## 12. Bảo mật và triển khai

- Không đưa `.env`, mật khẩu MongoDB, JWT Secret, Cloudinary API Secret hay mật khẩu quản trị lên GitHub.
- Cấp quyền Atlas tối thiểu cần thiết và chỉ cho phép IP phù hợp.
- Đổi các khóa đã từng bị chia sẻ công khai trước khi triển khai.
- Khi triển khai, cập nhật `CLIENT_URL`, biến môi trường và địa chỉ API theo môi trường thực tế.

## 13. Mã nguồn

GitHub: https://github.com/lehongphuptit/RIPT1306-20261-03_11_LTW_CuoiKy

---

*Tài liệu dành cho mục đích học tập và hướng dẫn chạy dự án Wanderly.*
