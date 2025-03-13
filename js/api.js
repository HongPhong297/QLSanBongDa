// index.js
const express = require('express');
const pool = require('./db');
const cors = require('cors'); // Thêm cors

const app = express();
const PORT = 3000;

// Middleware để parse JSON từ request
app.use(express.json());
app.use(cors()); // Cho phép tất cả origin
// Route cơ bản để kiểm tra API
app.get('/', (req, res) => {
  res.send('Stadium Rental API is running!');
});

// API lấy danh sách sân
app.get('/api/stadiums', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stadiums');
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

// API lấy chi tiết sân theo ID
app.get('/api/stadiums/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM stadiums WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stadium not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

// API thêm sân mới (cho chủ sân đăng ký)
app.post('/api/stadiums', async (req, res) => {
  const { owner_id, name, description, location, district, price, capacity, sport_type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO stadiums (owner_id, name, description, location, district, price, capacity, sport_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [owner_id, name, description, location, district, price, capacity, sport_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

// API đặt sân
// app.post('/api/bookings', async (req, res) => {
//   const { stadium_id, user_id, booking_date, start_time, end_time, total_price, customer_name, customer_email, customer_phone } = req.body;
//   try {
//     const result = await pool.query(
//       'INSERT INTO bookings (stadium_id, user_id, booking_date, start_time, end_time, total_price, status, customer_name, customer_email, customer_phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
//       [stadium_id, user_id, booking_date, start_time, end_time, total_price, 'pending', customer_name, customer_email, customer_phone]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err.stack);
//     res.status(500).json({ error: 'Database error' });
//   }
// });

// API đặt sân
app.post('/api/bookings', async (req, res) => {
  const { 
    stadium_id, 
    user_id, 
    booking_date, 
    start_time, 
    end_time, 
    total_price, 
    customer_name, 
    customer_email, 
    customer_phone,
    notes = null,
    payment_method = null
  } = req.body;

  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Kiểm tra stadium_id tồn tại
    const stadiumCheck = await client.query('SELECT id FROM stadiums WHERE id = $1', [stadium_id]);
    if (stadiumCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sân không tồn tại' });
    }
    
    // Nếu user_id được cung cấp, kiểm tra xem có tồn tại trong bảng users không
    if (user_id) {
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Người dùng không tồn tại' });
      }
    }
    
    // Kiểm tra thông tin bắt buộc
    if (!booking_date || !start_time || !end_time || !total_price || !customer_name || !customer_email || !customer_phone) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Thiếu thông tin đặt sân bắt buộc' });
    }
    
    // Kiểm tra xem sân có trống trong khoảng thời gian đó không
    const bookingCheck = await client.query(
      `SELECT * FROM bookings 
       WHERE stadium_id = $1 
       AND booking_date = $2 
       AND status != 'cancelled'
       AND (
         (start_time <= $3 AND end_time > $3) OR
         (start_time < $4 AND end_time >= $4) OR
         (start_time >= $3 AND end_time <= $4)
       )`,
      [stadium_id, booking_date, start_time, end_time]
    );
    
    if (bookingCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sân đã được đặt trong khoảng thời gian này' });
    }
    
    // Thêm booking vào database
    const result = await client.query(
      `INSERT INTO bookings 
       (stadium_id, user_id, booking_date, start_time, end_time, total_price, 
        status, payment_status, payment_method, customer_name, customer_email, customer_phone, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        stadium_id, 
        user_id, // Có thể là null nếu đặt sân không đăng nhập
        booking_date, 
        start_time, 
        end_time, 
        total_price, 
        'pending', 
        'pending', 
        payment_method, 
        customer_name, 
        customer_email, 
        customer_phone,
        notes
      ]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Đặt sân thành công',
      booking: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Lỗi khi đặt sân', 
      details: err.message 
    });
  } finally {
    client.release();
  }
});
// đăng kí đăng nhập
// API đăng ký người dùng
// API đăng ký người dùng
app.post('/api/register', async (req, res) => {
  const { email, password, fullname, phone, user_type } = req.body;
  
  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Kiểm tra email đã tồn tại chưa
    const checkEmail = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    // Mã hóa mật khẩu trước khi lưu vào database
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    // vivi
    // Thêm người dùng mới vào database
    const result = await client.query(
      'INSERT INTO users (email, password_hash, fullname, phone, user_type, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, email, fullname, phone, user_type, created_at',
      [email, password_hash, fullname, phone, user_type]
    );
    
    // Nếu đăng ký là stadium_owner, thêm thông tin vào bảng stadium_owners
    if (user_type === 'owner') {
      const { company_name, business_address, business_license } = req.body;
      
      // Kiểm tra các trường bắt buộc
      if (!company_name || !business_address || !business_license) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Thông tin doanh nghiệp không đầy đủ. Vui lòng cung cấp company_name, business_address và business_license' 
        });
      }
      
      // Thêm mặc định cho các trường có thể null
      const defaultCommissionRate = 5.00;
      const defaultSubscriptionPlan = 'basic';
      
      await client.query(
        'INSERT INTO stadium_owners (user_id, company_name, business_address, business_license, is_verified, subscription_plan, commission_rate) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [result.rows[0].id, company_name, business_address, business_license, false, defaultSubscriptionPlan, defaultCommissionRate]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in registration:', err.stack);
    res.status(500).json({ 
      error: 'Lỗi server', 
      details: err.message 
    });
  } finally {
    client.release();
  }
});

// API đăng nhập
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Tìm user theo email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    const user = result.rows[0];
    
    // Kiểm tra mật khẩu
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Nếu là stadium_owner, lấy thêm thông tin từ bảng stadium_owners
    let ownerData = {};
    if (user.user_type === 'owner') {
      const ownerResult = await pool.query('SELECT * FROM stadium_owners WHERE user_id = $1', [user.id]);
      if (ownerResult.rows.length > 0) {
        ownerData = ownerResult.rows[0];
      }
    }
    
    // Tạo JWT token
    const jwt = require('jsonwebtoken');
    const secretKey = process.env.JWT_SECRET || 'your-secret-key'; // Nên sử dụng biến môi trường
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        userType: user.user_type
      }, 
      secretKey, 
      { expiresIn: '24h' }
    );
    
    // Không trả về password_hash trong response
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        ...userWithoutPassword,
        ...(user.user_type === 'owner' ? { ownerDetails: ownerData } : {})
      }
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Middleware để xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - Không có token' });
  }
  
  const jwt = require('jsonwebtoken');
  const secretKey = process.env.JWT_SECRET || 'your-secret-key';
  
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden - Token không hợp lệ hoặc đã hết hạn' });
    }
    
    req.user = user;
    next();
  });
};

// API lấy thông tin người dùng hiện tại (yêu cầu xác thực)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, fullname, phone, user_type, created_at, updated_at, is_admin, profile_image FROM users WHERE id = $1', [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Nếu là stadium_owner, lấy thêm thông tin từ bảng stadium_owners
    if (user.user_type === 'owner') {
      const ownerResult = await pool.query('SELECT * FROM stadium_owners WHERE user_id = $1', [user.id]);
      if (ownerResult.rows.length > 0) {
        user.ownerDetails = ownerResult.rows[0];
      }
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Lỗi server' });
  }
});


//add 12_3_2025
// API lấy tất cả đặt sân của một người dùng
app.get('/api/bookings/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT b.id, b.stadium_id, b.user_id, b.booking_date, b.start_time, b.end_time, 
              b.total_price, b.status, b.payment_status, b.payment_method,
              b.customer_name, b.customer_email, b.customer_phone, b.notes,
              b.created_at, b.updated_at,
              s.name as stadium_name, s.location, s.district, s.sport_type
       FROM bookings b
       JOIN stadiums s ON b.stadium_id = s.id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC, b.start_time ASC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

// API cập nhật trạng thái đặt sân (hủy, xác nhận, v.v.)
app.patch('/api/bookings/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  const { status, payment_status, payment_method, notes } = req.body;
  
  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Kiểm tra booking có tồn tại không
    const bookingCheck = await client.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    
    if (bookingCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Xây dựng câu query update động dựa trên các trường được gửi lên
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    if (status) {
      // Kiểm tra status hợp lệ theo ràng buộc trong bảng
      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      }
      
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
      paramCount++;
    }
    
    if (payment_status) {
      updateFields.push(`payment_status = $${paramCount}`);
      updateValues.push(payment_status);
      paramCount++;
    }
    
    if (payment_method) {
      updateFields.push(`payment_method = $${paramCount}`);
      updateValues.push(payment_method);
      paramCount++;
    }
    
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      updateValues.push(notes);
      paramCount++;
    }
    
    // Luôn cập nhật thời gian
    updateFields.push(`updated_at = NOW()`);
    
    if (updateFields.length === 1) { // Chỉ có updated_at
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Không có thông tin nào để cập nhật' });
    }
    
    // Cập nhật booking
    const updateResult = await client.query(
      `UPDATE bookings 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      [...updateValues, bookingId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Cập nhật booking thành công',
      booking: updateResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

// API lấy tất cả đặt sân của một sân
app.get('/api/stadiums/:stadiumId/bookings', async (req, res) => {
  const { stadiumId } = req.params;
  const { startDate, endDate, status } = req.query;
  
  try {
    // Xây dựng query với điều kiện lọc
    let queryParams = [stadiumId];
    let conditions = ['b.stadium_id = $1'];
    let paramCount = 2;
    
    if (startDate) {
      conditions.push(`b.booking_date >= $${paramCount}`);
      queryParams.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      conditions.push(`b.booking_date <= $${paramCount}`);
      queryParams.push(endDate);
      paramCount++;
    }
    
    if (status) {
      conditions.push(`b.status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }
    
    // Lấy danh sách bookings
    const result = await pool.query(
      `SELECT b.id, b.stadium_id, b.user_id, b.booking_date, b.start_time, b.end_time, 
              b.total_price, b.status, b.payment_status, b.payment_method,
              b.customer_name, b.customer_email, b.customer_phone, b.notes,
              b.created_at, b.updated_at,
              u.fullname, u.email, u.phone
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.booking_date DESC, b.start_time ASC`,
      queryParams
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});
// Khởi động server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// API lấy thông tin của một user bằng ID
app.get('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT id, email, fullname, phone, created_at, updated_at, 
                is_admin, user_type, profile_image
         FROM users
         WHERE id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Người dùng không tồn tại' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({ error: 'Database error' });
    }
  });
  
  // API lấy tất cả users (có thể dùng cho quản trị)
  app.get('/api/users', async (req, res) => {
    const { email, fullname, user_type, limit = 20, offset = 0 } = req.query;
    
    try {
      // Xây dựng query với điều kiện lọc
      let queryParams = [];
      let conditions = [];
      let paramCount = 1;
      
      if (email) {
        conditions.push(`email ILIKE ${paramCount}`);
        queryParams.push(`%${email}%`);
        paramCount++;
      }
      
      if (fullname) {
        conditions.push(`fullname ILIKE ${paramCount}`);
        queryParams.push(`%${fullname}%`);
        paramCount++;
      }
      
      if (user_type) {
        conditions.push(`user_type = ${paramCount}`);
        queryParams.push(user_type);
        paramCount++;
      }
      
      // Thêm tham số phân trang
      const limitParam = paramCount++;
      const offsetParam = paramCount++;
      
      // Xây dựng câu query
      let query = `
        SELECT id, email, fullname, phone, created_at, updated_at, 
               is_admin, user_type, profile_image 
        FROM users
      `;
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += `
        ORDER BY created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;
      
      // Thêm tham số phân trang vào mảng params
      queryParams.push(parseInt(limit), parseInt(offset));
      
      // Thực hiện truy vấn
      const result = await pool.query(query, queryParams);
      
      // Đếm tổng số users (cho phân trang)
      let countQuery = 'SELECT COUNT(*) FROM users';
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2)); // Bỏ limit và offset
      const totalCount = parseInt(countResult.rows[0].count);
      
      res.json({
        data: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({ error: 'Database error' });
    }
  });
  
  // API cập nhật thông tin người dùng
  app.patch('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { fullname, phone, profile_image } = req.body;
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Kiểm tra user có tồn tại không
      const userCheck = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      
      if (userCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Người dùng không tồn tại' });
      }
      
      // Xây dựng câu query update động dựa trên các trường được gửi lên
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;
      
      if (fullname) {
        updateFields.push(`fullname = $${paramCount}`);
        updateValues.push(fullname);
        paramCount++;
      }
      
      if (phone) {
        updateFields.push(`phone = $${paramCount}`);
        updateValues.push(phone);
        paramCount++;
      }
      
      if (profile_image !== undefined) {
        updateFields.push(`profile_image = $${paramCount}`);
        updateValues.push(profile_image);
        paramCount++;
      }
      
      // Luôn cập nhật thời gian
      updateFields.push(`updated_at = NOW()`);
      
      if (updateFields.length === 1) { // Chỉ có updated_at
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Không có thông tin nào để cập nhật' });
      }
      
      // Cập nhật user
      const updateResult = await client.query(
        `UPDATE users 
         SET ${updateFields.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING id, email, fullname, phone, created_at, updated_at, is_admin, user_type, profile_image`,
        [...updateValues, userId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Cập nhật thông tin người dùng thành công',
        user: updateResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err.stack);
      res.status(500).json({ error: 'Database error' });
    } finally {
      client.release();
    }
  });
  
 // API tìm kiếm người dùng theo fullname
app.get('/api/users/search/name/:fullname', async (req, res) => {
  const { fullname } = req.params;
  
  try {
    // Log để debug
    console.log('Tìm kiếm người dùng với fullname:', fullname);
    
    const result = await pool.query(
      `SELECT id, email, fullname, phone, created_at, updated_at, 
              is_admin, user_type, profile_image
       FROM users
       WHERE fullname ILIKE $1
       ORDER BY fullname ASC
       LIMIT 10`,
      [`%${fullname}%`]
    );
    
    // Log kết quả để debug
    console.log('Kết quả tìm kiếm:', result.rows);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi khi tìm kiếm user:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});
  
  // API kiểm tra email đã tồn tại chưa (dùng cho đăng ký)
  app.get('/api/users/check-email/:email', async (req, res) => {
    const { email } = req.params;
    
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM users WHERE email = $1',
        [email]
      );
      
      const exists = parseInt(result.rows[0].count) > 0;
      
      res.json({
        email,
        exists
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({ error: 'Database error' });
    }
  });
app.listen(PORT, '0.0.0.0', () => { // Lắng nghe trên 0.0.0.0
  console.log(`Server running on port ${PORT}`);
});