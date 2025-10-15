# 📊 PHÂN TÍCH CHI TIẾT LOGIC KIỂM TRA VÀ LƯU KẾT QUẢ

## 🎯 TỔNG QUAN HỆ THỐNG

Hệ thống kiểm tra và lưu kết quả được thiết kế với flow hoàn chỉnh từ Frontend → Backend → Database, đảm bảo:
- ✅ Tính toán điểm chính xác
- ✅ Lưu trữ lịch sử làm bài
- ✅ Theo dõi điểm cao nhất
- ✅ Hiển thị chi tiết từng câu trả lời
- ✅ Quản lý thời gian làm bài

---

## 📁 CẤU TRÚC FILE VÀ VAI TRÒ

### **Frontend:**
1. **`Tests.jsx`** - Danh sách bài kiểm tra với tóm tắt lịch sử
2. **`TestRunner.jsx`** - Giao diện làm bài và hiển thị kết quả
3. **`testService.js`** - API service layer

### **Backend:**
1. **`test_route.py`** - REST API endpoints cho test
2. **`attempt_model.py`** - Database model lưu lịch sử

---

## 🔄 FLOW HOÀN CHỈNH TỪ ĐẦU ĐẾN CUỐI

### **BƯỚC 1: DANH SÁCH BÀI KIỂM TRA (`Tests.jsx`)**

#### 🎬 Khởi động và Load Data
```jsx
useEffect(() => {
  const data = await listTests();  // GET /api/tests
  setTests(data);
  
  // Load lịch sử làm bài cho mỗi test
  if (user?.user_id) {
    await Promise.all(
      data.map(async (t) => {
        const s = await getTestAttempts(t.test_id, user.user_id);
        // GET /api/tests/{test_id}/attempts?user_id=xxx
        summaries[t.test_id] = {
          count: s.count,              // Số lần làm
          best_score: s.best_score,    // Điểm cao nhất (raw score)
          last_submitted_at: s.last_submitted_at
        };
      })
    );
  }
}, []);
```

#### 📊 Hiển thị Thông Tin
- **Số lần đã làm**: Badge hiển thị `Đã làm: X`
- **Điểm cao nhất**: Badge màu xanh `Điểm cao nhất: Y`
- **Lần gần nhất**: Timestamp của lần làm bài cuối

#### 🔗 Chuyển sang màn làm bài
```jsx
<Link 
  to={`/student/tests/${t.test_id}`}
  state={{ freshStart: true }}  // ⚠️ Quan trọng: Reset timer
>
  Bắt đầu
</Link>
```

---

### **BƯỚC 2: LÀM BÀI KIỂM TRA (`TestRunner.jsx`)**

#### 🎯 Load Thông Tin Test
```jsx
useEffect(() => {
  const [metaResp, qs] = await Promise.all([
    getTestMeta(testId),      // GET /api/tests/{test_id}
    getTestQuestions(testId), // GET /api/tests/{test_id}/questions
  ]);
  setMeta(metaResp);
  setQuestions(qs);
}, [testId]);
```

**Dữ liệu nhận được:**
- `meta`: Thông tin test (tên, mô tả, thời lượng, tổng câu hỏi)
- `questions`: Mảng câu hỏi với cấu trúc:
  ```javascript
  {
    order: 1,                    // Số thứ tự câu hỏi
    qs_index: 101,              // item_id trong DB
    qs_desciption: "...",       // Đề bài
    item_stimulus_text: "...",  // Văn bản kích thích
    item_image_path: "...",     // Đường dẫn hình ảnh
    item_audio_path: "...",     // Đường dẫn audio
    part_id: 1,                 // ID phần thi
    part_name: "Part 1",        // Tên phần
    answers: [                  // Các lựa chọn
      {
        as_index: 401,          // choice_id trong DB
        as_content: "...",      // Nội dung đáp án
        choice_label: "A"       // Nhãn A, B, C, D
      }
    ]
  }
  ```

#### ⏱️ Quản Lý Thời Gian với `useCountdown` Hook

```jsx
// Tính thời gian
const durationMin = Number(meta?.test_duration_min ?? 0) || 0;
const totalSeconds = durationMin * 60;
const storageId = `test-${testId}-${user?.user_id || 'anon'}-v2`;

// Hook countdown với auto-submit callback
const { remaining, setRemaining, format, reset } = useCountdown(
  totalSeconds, 
  storageId, 
  async () => {
    // Callback khi hết giờ
    if (!autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      await doSubmit();  // Tự động nộp bài
    }
  }
);

// Khởi tạo countdown
useEffect(() => {
  const key = `countdown:${storageId}`;
  const persisted = Number(localStorage.getItem(key));
  const freshStart = Boolean(location.state?.freshStart);
  
  if (freshStart) {
    // ✨ Bắt đầu mới: Reset về thời gian đầy đủ
    localStorage.setItem(key, String(totalSeconds));
    setRemaining(totalSeconds);
    // Xóa flag để reload không reset lại
    history.replaceState({...history.state, usr: {...location.state, freshStart: false}}, '');
  } else if (!Number.isFinite(persisted) || persisted <= 0) {
    // Không có thời gian lưu hoặc đã hết
    localStorage.setItem(key, String(totalSeconds));
    setRemaining(totalSeconds);
  }
  // Else: Tiếp tục với thời gian đã lưu
}, [enableTimer, storageId, totalSeconds, location.state, setRemaining]);
```

**⚠️ Chi tiết Quản Lý Thời Gian:**
- **LocalStorage Key**: `countdown:test-{testId}-{userId}-v2`
- **Lưu mỗi giây**: Hook tự động lưu `remaining` vào localStorage
- **Reload page**: Thời gian được phục hồi từ localStorage
- **freshStart=true**: Reset về thời gian ban đầu (khi ấn "Bắt đầu" từ Tests.jsx)
- **Auto-submit**: Khi `remaining === 0`, tự động gọi `doSubmit()`

#### 📝 Lưu Câu Trả Lời

```jsx
const [answers, setAnswers] = useState({});
// Cấu trúc: { [item_id]: choice_id }
// Ví dụ: { 101: 401, 102: 405, 103: 409 }

const onChoose = (itemId, choiceId) => {
  setAnswers(prev => ({ ...prev, [itemId]: choiceId }));
};
```

#### 🚀 Nộp Bài Test

```jsx
const doSubmit = async () => {
  try {
    setSubmitting(true);
    
    // Chuyển đổi từ object sang array theo format backend yêu cầu
    const responses = Object.entries(answers).map(([qs_index, as_choice_id]) => ({
      qs_index: Number(qs_index),  // item_id
      as_index: as_choice_id,      // choice_id
    }));
    
    const payload = {
      user_id: user?.user_id,
      class_id: undefined,  // Optional, backend sẽ dùng default = 1
      responses,
    };
    
    // POST /api/tests/{testId}/submit
    const resp = await submitTest(testId, payload);
    setResult(resp);
    
  } catch (e) {
    setError(e.message || 'Nộp bài thất bại');
  } finally {
    setSubmitting(false);
  }
};
```

**Payload gửi lên backend:**
```json
{
  "user_id": "SV001",
  "class_id": null,
  "responses": [
    { "qs_index": 101, "as_index": 401 },
    { "qs_index": 102, "as_index": 405 },
    { "qs_index": 103, "as_index": 409 }
  ]
}
```

---

### **BƯỚC 3: XỬ LÝ BACKEND (`test_route.py` - `submit_test`)**

#### 📊 Tính Điểm Chi Tiết

```python
@test_bp.route("/<int:test_id>/submit", methods=["POST"])
def submit_test(test_id):
    payload = request.get_json() or {}
    user_id = payload.get("user_id")
    class_id = payload.get("class_id")
    responses = payload.get("responses", [])
    
    # ====== TÍNH ĐIỂM ======
    total_correct = 0
    total_questions = len(responses)
    detailed_responses = []
    
    for idx, response in enumerate(responses):
        qs_index = response.get("qs_index")  # item_id
        as_index = response.get("as_index")  # choice_id
        
        # Lấy thông tin item
        item = Item.query.get(qs_index)
        
        # Kiểm tra đáp án đúng
        choice = Choice.query.filter(
            Choice.choice_id == as_index,
            Choice.item_id == qs_index
        ).first()
        
        is_correct = choice and choice.choice_is_correct
        if is_correct:
            total_correct += 1
        
        # Lưu chi tiết từng câu
        detailed_responses.append({
            "question_number": idx + 1,
            "item_id": qs_index,
            "selected_choice_id": as_index,
            "is_correct": is_correct,
            "part_id": item.part_id if item else None,
            "part_name": item.part.part_name if (item and item.part) else None
        })
    
    # ====== TÍNH CÁC CHỈ SỐ ======
    score_ratio = total_correct / total_questions if total_questions > 0 else 0
    final_score = total_correct                    # Raw score (số câu đúng)
    percentage = round(score_ratio * 100, 2)       # Tỷ lệ % (0-100)
    passed = score_ratio >= 0.5                    # Đạt nếu >=50%
    low_threshold_ratio = 0.3
    low_score_warning = score_ratio < low_threshold_ratio  # Cảnh báo <30%
```

**🧮 Công Thức Tính Điểm:**
- **Raw Score** = Số câu đúng (dùng để so sánh lịch sử)
- **Percentage** = (Số câu đúng / Tổng câu) × 100
- **Score Thang 10** = (Số câu đúng / Tổng câu) × 10 (tính ở frontend)
- **Passed** = Percentage >= 50%
- **Low Score Warning** = Percentage < 30%

#### 💾 Lưu Vào Database (Bảng `attempts`)

```python
# ====== CHUẨN BỊ JSON DATA ======
responses_data = {
    "total_questions": total_questions,
    "correct_count": total_correct,
    "percentage": percentage,
    "responses": detailed_responses  # Chi tiết từng câu
}

json_str = json.dumps(responses_data, ensure_ascii=False)
json_length = len(json_str)

# ⚠️ KIỂM TRA GIỚI HẠN VARCHAR(2048)
print(f"[INFO] JSON data length: {json_length} characters")
if json_length > 2048:
    print(f"[WARNING] JSON length exceeds VARCHAR(2048) limit!")
    print(f"[WARNING] Data may be truncated!")

# ====== LƯU ATTEMPT ======
if user_id:
    # Nếu không có class_id, dùng mặc định = 1
    if class_id is None:
        class_id = 1
        print(f"[INFO] No class_id provided, using default class_id = 1")
    
    try:
        attempt = Attempt(
            user_id=user_id,
            test_id=test_id,
            class_id=class_id,
            att_started_at=datetime.datetime.now(),
            att_submitted_at=datetime.datetime.now(),
            att_raw_score=final_score,               # 🔑 Raw score (số câu đúng)
            att_status="COMPLETED",
            att_responses_json=json_str              # 🔑 JSON chi tiết
        )
        db.session.add(attempt)
        db.session.commit()
        current_attempt_id = attempt.att_id
        
        print(f"[SUCCESS] Attempt saved with ID: {current_attempt_id}")
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to save attempt: {str(e)}")
        raise
```

**🗃️ Cấu trúc bảng `attempts`:**
```sql
CREATE TABLE attempts (
    att_id INT PRIMARY KEY AUTO_INCREMENT,
    test_id INT NOT NULL,
    user_id VARCHAR(10) NOT NULL,
    class_id INT,
    att_started_at DATETIME,
    att_submitted_at DATETIME,
    att_raw_score INT,                    -- Số câu đúng (dùng để so sánh)
    att_scaled_listening INT,             -- Chưa dùng
    att_scaled_reading INT,               -- Chưa dùng
    att_status VARCHAR(12),               -- "COMPLETED"
    att_responses_json VARCHAR(2048),     -- 🔥 JSON chi tiết (CÓ GIỚI HẠN!)
    FOREIGN KEY (test_id) REFERENCES tests(test_id)
);
```

**⚠️ VẤN ĐỀ QUAN TRỌNG - VARCHAR(2048) LIMIT:**
- Field `att_responses_json` chỉ lưu được tối đa **2048 ký tự**
- Nếu test có **nhiều câu hỏi** (>40 câu), JSON có thể bị cắt
- **Hậu quả**: Parse JSON sẽ lỗi khi đọc lịch sử
- **Giải pháp**: 
  - Ngắn hạn: Backend fallback về `att_raw_score` nếu parse lỗi
  - Dài hạn: Đổi sang `TEXT` hoặc `JSON` type trong MySQL

#### 📚 Lấy Lịch Sử Làm Bài

```python
# ====== TÌM TẤT CẢ ATTEMPTS CỦA USER CHO TEST NÀY ======
attempts_list = []
best_score = None

if user_id:
    user_attempts = (
        Attempt.query
        .filter(Attempt.user_id == user_id, Attempt.test_id == test_id)
        .order_by(Attempt.att_submitted_at.desc())  # Mới nhất trước
        .all()
    )
    
    # ====== PARSE JSON CHO MỖI ATTEMPT ======
    for a in user_attempts:
        attempt_dict = a.to_dict()
        
        # Try parse JSON
        if a.att_responses_json:
            try:
                parsed_data = json.loads(a.att_responses_json)
                attempt_dict["att_correct_count"] = parsed_data.get("correct_count")
                attempt_dict["att_total_questions"] = parsed_data.get("total_questions")
                attempt_dict["att_percentage"] = parsed_data.get("percentage")
            except Exception as e:
                # 🔥 FALLBACK: JSON bị lỗi (truncated hoặc corrupt)
                print(f"[WARNING] Failed to parse JSON for attempt {a.att_id}: {str(e)}")
                if total_questions > 0:
                    attempt_dict["att_correct_count"] = a.att_raw_score
                    attempt_dict["att_total_questions"] = total_questions
                    attempt_dict["att_percentage"] = round((a.att_raw_score / total_questions) * 100, 2)
        else:
            # Không có JSON (old records hoặc NULL)
            if a.att_raw_score is not None and total_questions > 0:
                attempt_dict["att_correct_count"] = a.att_raw_score
                attempt_dict["att_total_questions"] = total_questions
                attempt_dict["att_percentage"] = round((a.att_raw_score / total_questions) * 100, 2)
        
        attempts_list.append(attempt_dict)
    
    # ====== TÌM ĐIỂM CAO NHẤT ======
    if user_attempts:
        best_score = max((a.att_raw_score or 0) for a in user_attempts)
```

**🏆 Logic Tìm Best Score:**
- So sánh tất cả `att_raw_score` trong lịch sử
- Trả về giá trị **MAX**
- Dùng `or 0` để xử lý `NULL`

#### 📤 Trả Về Response

```python
result = {
    "sc_score": final_score,              # Điểm lần này (raw)
    "passed": passed,                     # True/False
    "breakdown": {
        "correct": total_correct,         # Số câu đúng
        "total": total_questions,         # Tổng số câu
        "percentage": percentage          # Tỷ lệ %
    },
    # 📚 Lịch sử làm bài
    "attempts": attempts_list,            # Array của tất cả attempts
    "best_score": best_score,             # Điểm cao nhất (raw)
    "current_attempt_id": current_attempt_id,  # ID attempt vừa tạo
    # 📝 Chi tiết câu trả lời lần này
    "detailed_responses": detailed_responses,
    # ⚠️ Cảnh báo
    "low_score_warning": low_score_warning,
    "low_score_threshold_percent": int(low_threshold_ratio * 100)
}

return success_response(result)
```

---

### **BƯỚC 4: HIỂN THỊ KẾT QUẢ (`TestRunner.jsx`)**

#### 🧮 Tính Điểm Thang 10

```jsx
if (result) {
  const totalQuestions = Number(result?.breakdown?.total ?? total ?? 0);
  const correctAnswers = Number(result?.breakdown?.correct ?? 0);
  
  // Điểm mỗi câu trên thang 10
  const scorePerQuestion = totalQuestions > 0 ? 10 / totalQuestions : 0;
  
  // Điểm lần này (thang 10)
  const currentScore10 = Number.isFinite(scorePerQuestion)
    ? Number((correctAnswers * scorePerQuestion).toFixed(2))
    : 0;
  
  // ====== XỬ LÝ LỊCH SỬ VÀ TÌM BEST SCORE ======
  const attemptsWithScore = Array.isArray(result?.attempts)
    ? result.attempts.map((attempt) => {
        const attemptTotal = Number(attempt.att_total_questions ?? totalQuestions ?? 0);
        const attemptCorrect = Number(attempt.att_correct_count ?? 0);
        const perQuestion = attemptTotal > 0 ? 10 / attemptTotal : 0;
        const score10 = Number.isFinite(perQuestion)
          ? Number((attemptCorrect * perQuestion).toFixed(2))
          : 0;
        return {
          ...attempt,
          _score10: score10,                    // 🔑 Điểm thang 10
          _attemptTotal: attemptTotal,
          _attemptCorrect: attemptCorrect,
        };
      })
    : [];
  
  // 🏆 Tìm điểm cao nhất trong tất cả attempts
  const bestScore10 = attemptsWithScore.length
    ? attemptsWithScore.reduce((max, attempt) => 
        (attempt._score10 > max ? attempt._score10 : max), 0)
    : currentScore10;
  
  // Helper format điểm
  const formatScore10 = (score) => 
    (Number.isFinite(score) ? score.toFixed(score % 1 === 0 ? 0 : 2) : '-');
```

**🧮 Công Thức Frontend:**
```
scorePerQuestion = 10 / total_questions

Ví dụ: Test 30 câu
→ scorePerQuestion = 10 / 30 = 0.333...

Đúng 25 câu:
→ score10 = 25 × 0.333... = 8.33

Đúng 30 câu:
→ score10 = 30 × 0.333... = 10.00
```

#### 📊 Hiển Thị 3 Card Chính

```jsx
<div className="row g-3 mb-3">
  {/* Card 1: Điểm lần này */}
  <div className="col-md-4">
    <div className="card bg-light border-0">
      <div className="card-body text-center">
        <div className="text-muted small mb-1">Điểm lần này</div>
        <div className="fs-2 fw-bold text-primary">
          {formatScore10(currentScore10)}
        </div>
        <div className="text-muted small">(thang điểm 10)</div>
      </div>
    </div>
  </div>
  
  {/* Card 2: Điểm cao nhất */}
  <div className="col-md-4">
    <div className="card bg-light border-0">
      <div className="card-body text-center">
        <div className="text-muted small mb-1">🏆 Điểm cao nhất</div>
        <div className="fs-2 fw-bold text-success">
          {formatScore10(bestScore10)}
        </div>
        <div className="text-muted small">(thang điểm 10)</div>
      </div>
    </div>
  </div>
  
  {/* Card 3: Trạng thái đạt/chưa đạt */}
  <div className="col-md-4">
    <div className="card bg-light border-0">
      <div className="card-body text-center">
        <div className="text-muted small mb-1">Kết quả</div>
        <span className={`badge fs-5 ${result?.passed ? 'bg-success' : 'bg-secondary'}`}>
          {result?.passed ? '✓ Đạt' : '✗ Chưa đạt'}
        </span>
      </div>
    </div>
  </div>
</div>
```

#### 📊 Thống Kê Tổng Quan

```jsx
<div className="alert alert-info mb-3">
  <div className="row text-center">
    <div className="col-4">
      <strong>Số câu đúng</strong>
      <div className="fs-5">
        {result?.breakdown?.correct ?? 0} / {result?.breakdown?.total ?? total}
      </div>
    </div>
    <div className="col-4">
      <strong>Tỷ lệ đúng</strong>
      <div className="fs-5">{result?.breakdown?.percentage ?? 0}%</div>
    </div>
    <div className="col-4">
      <strong>Số lần làm</strong>
      <div className="fs-5">{result?.attempts?.length ?? 0}</div>
    </div>
  </div>
</div>
```

#### 📝 Chi Tiết Từng Câu

```jsx
{Array.isArray(result?.detailed_responses) && result.detailed_responses.length > 0 && (
  <div className="mb-4">
    <h6 className="mb-3">📝 Chi tiết từng câu</h6>
    <div className="table-responsive">
      <table className="table table-sm table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: '60px' }} className="text-center">Câu</th>
            <th>Phần thi</th>
            <th style={{ width: '120px' }} className="text-center">Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {result.detailed_responses.map((resp, idx) => (
            <tr key={idx} className={resp.is_correct ? 'table-success' : 'table-danger'}>
              <td className="text-center fw-bold">{resp.question_number}</td>
              <td>{resp.part_name || `Part ${resp.part_id || '-'}`}</td>
              <td className="text-center">
                {resp.is_correct ? (
                  <span className="badge bg-success">✓ Đúng</span>
                ) : (
                  <span className="badge bg-danger">✗ Sai</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
```

#### 📚 Lịch Sử Làm Bài (Bảng Chi Tiết)

```jsx
{attemptsWithScore.length > 0 && (
  <div className="mb-3">
    <h6 className="mb-3">📊 Lịch sử làm bài ({attemptsWithScore.length} lần)</h6>
    <div className="table-responsive">
      <table className="table table-sm table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: '50px' }}>#</th>
            <th>Thời gian nộp</th>
            <th style={{ width: '120px' }} className="text-center">Điểm (0-10)</th>
            <th style={{ width: '120px' }} className="text-center">Đúng/Tổng</th>
            <th style={{ width: '100px' }} className="text-center">Tỷ lệ</th>
            <th style={{ width: '120px' }} className="text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {attemptsWithScore.map((a, idx) => {
            const isBest = Math.abs(a._score10 - bestScore10) < 0.01;  // Đây là best score
            const isCurrent = a.att_id === result.current_attempt_id;   // Lần vừa làm
            return (
              <tr key={a.att_id || idx} className={isCurrent ? 'table-info' : ''}>
                <td className="text-center">{idx + 1}</td>
                
                {/* Thời gian nộp */}
                <td>
                  <small>{a.att_submitted_at ? 
                    new Date(a.att_submitted_at).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </small>
                </td>
                
                {/* Điểm thang 10 */}
                <td className="text-center">
                  <strong className="fs-6">{formatScore10(a._score10)}</strong>
                  {isBest && <div><span className="badge bg-warning text-dark">🏆 Best</span></div>}
                </td>
                
                {/* Số câu đúng/tổng */}
                <td className="text-center">
                  {a._attemptCorrect ?? '-'} / {a._attemptTotal ?? '-'}
                </td>
                
                {/* Tỷ lệ % với màu sắc */}
                <td className="text-center">
                  {typeof a.att_percentage === 'number' ? (
                    <span className={`badge ${a.att_percentage >= 50 ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {a.att_percentage.toFixed(1)}%
                    </span>
                  ) : '-'}
                </td>
                
                {/* Trạng thái */}
                <td className="text-center">
                  <span className={`badge ${a.att_status === 'COMPLETED' ? 'bg-success' : 'bg-secondary'}`}>
                    {a.att_status || '—'}
                  </span>
                  {isCurrent && <div><span className="badge bg-info mt-1">Mới nhất</span></div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
)}
```

**🎨 Highlights trong bảng lịch sử:**
- **Background `table-info`**: Row của lần làm mới nhất
- **Badge 🏆 Best**: Lần làm đạt điểm cao nhất
- **Badge "Mới nhất"**: Attempt vừa submit
- **Màu tỷ lệ**: Xanh nếu ≥50%, vàng nếu <50%

#### 🔄 Nút Làm Lại

```jsx
<button 
  className="btn btn-outline-success" 
  onClick={() => {
    // ⚠️ QUAN TRỌNG: Reload page để reset tất cả state
    window.location.reload();
  }}
>
  🔄 Làm lại bài test
</button>
```

**⚠️ Lưu ý về Làm lại:**
- Dùng `window.location.reload()` để reset HOÀN TOÀN component
- Thời gian countdown sẽ reset về giá trị ban đầu
- Câu trả lời cũ bị xóa
- ❌ KHÔNG dùng `freshStart: true` vì state đã bị set `result`

---

## 🔍 API ENDPOINTS SUMMARY

### 1. **GET** `/api/tests`
- **Mục đích**: Lấy danh sách tất cả tests
- **Response**: Array of test objects
  ```json
  [
    {
      "test_id": 1,
      "test_name": "TOEIC Test 1",
      "test_description": "...",
      "test_duration_min": 120,
      "test_total_questions": 100
    }
  ]
  ```

### 2. **GET** `/api/tests/{test_id}`
- **Mục đích**: Lấy thông tin meta của 1 test
- **Response**: Test object
  ```json
  {
    "test_id": 1,
    "test_name": "TOEIC Test 1",
    "test_duration_min": 120,
    "test_total_questions": 100
  }
  ```

### 3. **GET** `/api/tests/{test_id}/questions`
- **Mục đích**: Lấy tất cả câu hỏi của test
- **Response**: Array of question objects (đã sorted theo Part và Order)
  ```json
  [
    {
      "order": 1,
      "qs_index": 101,
      "qs_desciption": "Where is the man?",
      "item_image_path": "/img/test1/q1.jpg",
      "item_audio_path": "/audio/test1/q1.mp3",
      "part_id": 1,
      "part_name": "Part 1 - Photographs",
      "answers": [
        {
          "as_index": 401,
          "as_content": "In an office",
          "choice_label": "A"
        }
      ]
    }
  ]
  ```

### 4. **POST** `/api/tests/{test_id}/submit`
- **Mục đích**: Nộp bài kiểm tra
- **Request Body**:
  ```json
  {
    "user_id": "SV001",
    "class_id": null,
    "responses": [
      { "qs_index": 101, "as_index": 401 },
      { "qs_index": 102, "as_index": 405 }
    ]
  }
  ```
- **Response**: Kết quả chi tiết + lịch sử
  ```json
  {
    "sc_score": 25,
    "passed": true,
    "breakdown": {
      "correct": 25,
      "total": 30,
      "percentage": 83.33
    },
    "attempts": [...],
    "best_score": 28,
    "current_attempt_id": 123,
    "detailed_responses": [...],
    "low_score_warning": false,
    "low_score_threshold_percent": 30
  }
  ```

### 5. **GET** `/api/tests/{test_id}/attempts?user_id={user_id}`
- **Mục đích**: Lấy lịch sử làm bài của 1 user cho 1 test
- **Response**:
  ```json
  {
    "attempts": [...],
    "best_score": 28,
    "count": 5,
    "last_submitted_at": "2025-10-15T10:30:00"
  }
  ```

### 6. **GET** `/api/tests/class/{class_id}/student-results?user_id={user_id}`
- **Mục đích**: Lấy kết quả tất cả tests của 1 học viên trong lớp
- **Response**:
  ```json
  {
    "tests": [
      {
        "test_id": 1,
        "test_name": "...",
        "student_best_score": 28,
        "student_score_10": 9.33,
        "student_percentage": 93.33,
        "student_attempt_count": 3,
        "class_total_participants": 15,
        "has_attempted": true
      }
    ],
    "total_tests": 10,
    "student_info": {
      "user_id": "SV001",
      "class_id": 1,
      "class_name": "TOEIC Basic"
    }
  }
  ```

---

## 📊 DATABASE SCHEMA SUMMARY

### Bảng `attempts`
```sql
CREATE TABLE attempts (
    att_id INT PRIMARY KEY AUTO_INCREMENT,
    test_id INT NOT NULL,
    user_id VARCHAR(10) NOT NULL,
    class_id INT,
    att_started_at DATETIME,
    att_submitted_at DATETIME,
    att_raw_score INT,                    -- 🔑 Số câu đúng
    att_scaled_listening INT,
    att_scaled_reading INT,
    att_status VARCHAR(12),               -- "COMPLETED"
    att_responses_json VARCHAR(2048),     -- 🔥 Chi tiết JSON (CÓ GIỚI HẠN!)
    
    FOREIGN KEY (test_id) REFERENCES tests(test_id),
    INDEX idx_user_test (user_id, test_id)
);
```

### Bảng `tests`
```sql
CREATE TABLE tests (
    test_id INT PRIMARY KEY AUTO_INCREMENT,
    test_name VARCHAR(255),
    test_description TEXT,
    test_duration_min INT,
    test_total_questions INT,
    test_status DATETIME
);
```

### Bảng `items` (Questions)
```sql
CREATE TABLE items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    test_id INT NOT NULL,
    part_id INT,
    item_order_in_part INT,
    item_question_text TEXT,
    item_stimulus_text TEXT,
    item_image_path VARCHAR(255),
    item_audio_path VARCHAR(255),
    
    FOREIGN KEY (test_id) REFERENCES tests(test_id),
    FOREIGN KEY (part_id) REFERENCES parts(part_id)
);
```

### Bảng `choices` (Answers)
```sql
CREATE TABLE choices (
    choice_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    choice_content TEXT,
    choice_label VARCHAR(10),
    choice_is_correct BOOLEAN,
    
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);
```

---

## 🔥 VẤN ĐỀ VÀ GIẢI PHÁP

### ⚠️ **VẤN ĐỀ 1: VARCHAR(2048) LIMIT**

**Vấn đề:**
- Field `att_responses_json` chỉ lưu được 2048 ký tự
- Test nhiều câu → JSON quá lớn → bị cắt (truncated)
- Parse JSON lỗi khi đọc lịch sử

**Ví dụ:**
```
Test 50 câu, mỗi response ~80 chars
→ Total JSON ~4000 chars
→ Vượt quá 2048 → BỊ CẮT
→ JSON không hợp lệ → json.loads() FAIL
```

**Giải pháp hiện tại (Fallback):**
```python
try:
    parsed_data = json.loads(a.att_responses_json)
    # Dùng data từ JSON
except Exception as e:
    # Fallback: Dùng att_raw_score
    attempt_dict["att_correct_count"] = a.att_raw_score
    attempt_dict["att_total_questions"] = total_questions
    attempt_dict["att_percentage"] = round((a.att_raw_score / total_questions) * 100, 2)
```

**Giải pháp lâu dài:**
1. **Đổi field type**:
   ```sql
   ALTER TABLE attempts 
   MODIFY COLUMN att_responses_json TEXT;
   -- hoặc JSON type nếu MySQL 5.7+
   ALTER TABLE attempts 
   MODIFY COLUMN att_responses_json JSON;
   ```

2. **Lưu riêng bảng**:
   ```sql
   CREATE TABLE attempt_details (
       detail_id INT PRIMARY KEY AUTO_INCREMENT,
       att_id INT NOT NULL,
       question_number INT,
       item_id INT,
       selected_choice_id INT,
       is_correct BOOLEAN,
       FOREIGN KEY (att_id) REFERENCES attempts(att_id)
   );
   ```

### ⚠️ **VẤN ĐỀ 2: Reload Page vs State Management**

**Vấn đề:**
- Làm lại test cần reset hoàn toàn state
- Nhưng đang hiển thị kết quả (`result !== null`)
- Navigate không reset local state

**Giải pháp hiện tại:**
```jsx
<button onClick={() => window.location.reload()}>
  🔄 Làm lại bài test
</button>
```

**Lưu ý:**
- ✅ Reset TOÀN BỘ component
- ✅ Countdown reset về 0 (chờ freshStart từ Tests.jsx)
- ❌ User phải ấn "Bắt đầu" lại từ Tests.jsx với `freshStart: true`

**Giải pháp tốt hơn (Alternative):**
```jsx
<button onClick={() => {
  navigate(`/student/tests/${testId}`, {
    state: { freshStart: true },
    replace: true
  });
  window.location.reload(); // Vẫn cần reload để clear state
}}>
  🔄 Làm lại bài test
</button>
```

### ⚠️ **VẤN ĐỀ 3: Countdown Persistence**

**Vấn đề:**
- LocalStorage lưu thời gian còn lại
- Reload page → Tiếp tục countdown
- Nhưng đóng tab → Mở lại vẫn tiếp tục?

**Behavior hiện tại:**
- ✅ Reload page: Tiếp tục countdown
- ✅ F5: Tiếp tục countdown
- ⚠️ Đóng tab → Mở lại: Vẫn tiếp tục (nếu không hết giờ)
- ⚠️ Hết giờ khi offline: Mở lại sẽ auto-submit

**Có thể cải thiện:**
```jsx
// Thêm timestamp bắt đầu
const startedAt = localStorage.getItem(`test-${testId}-started-at`);
if (!startedAt) {
  localStorage.setItem(`test-${testId}-started-at`, Date.now());
}

// Khi reload, tính thời gian đã trôi qua
const elapsed = Math.floor((Date.now() - startedAt) / 1000);
const newRemaining = Math.max(0, totalSeconds - elapsed);
setRemaining(newRemaining);
```

---

## 📈 OPTIMIZATION OPPORTUNITIES

### 1. **Database Indexing**
```sql
-- Index cho query attempts by user + test
CREATE INDEX idx_attempts_user_test ON attempts(user_id, test_id);

-- Index cho query best score
CREATE INDEX idx_attempts_score ON attempts(test_id, user_id, att_raw_score DESC);
```

### 2. **Caching Best Score**
- Thêm field `best_score` vào bảng `user_test_progress`
- Update mỗi khi submit
- Không cần query MAX mỗi lần

### 3. **Paginate History**
- Lịch sử làm bài nhiều → Response lớn
- Implement pagination: Chỉ load 10 lần gần nhất
- Thêm button "Xem thêm" nếu cần

### 4. **Compress JSON**
- Rút gọn key names: `question_number` → `qn`
- Bỏ field không cần thiết
- Dùng array thay vì object khi có thể

---

## 🎯 TESTING CHECKLIST

### ✅ Unit Tests (Backend)
- [ ] Test tính điểm với các trường hợp:
  - Tất cả đúng (100%)
  - Tất cả sai (0%)
  - 50% đúng (pass threshold)
  - 30% đúng (low score warning)
  - Một số câu bỏ trống
- [ ] Test JSON truncation handling
- [ ] Test best score calculation với nhiều attempts
- [ ] Test với test không có câu hỏi (edge case)

### ✅ Integration Tests (Frontend + Backend)
- [ ] Submit test và verify response
- [ ] Submit nhiều lần, verify best score đúng
- [ ] Reload page trong khi làm bài, verify countdown
- [ ] Hết giờ auto-submit, verify kết quả được lưu
- [ ] Click "Làm lại", verify reset đúng

### ✅ UI/UX Tests
- [ ] Hiển thị điểm thang 10 chính xác
- [ ] Highlight best score trong lịch sử
- [ ] Badge "Mới nhất" hiển thị đúng
- [ ] Responsive trên mobile
- [ ] Loading states khi submit

---

## 📚 REFERENCES

### Files Related:
1. `frontend-for-lms/src/pages/student/Tests.jsx`
2. `frontend-for-lms/src/pages/student/TestRunner.jsx`
3. `frontend-for-lms/src/services/testService.js`
4. `backend-for-lms/app/routes/test_route.py`
5. `backend-for-lms/app/models/attempt_model.py`

### Key Functions:
- **Frontend**: `doSubmit()`, `useCountdown()`, `formatScore10()`
- **Backend**: `submit_test()`, `get_test_questions()`, `list_attempts_for_test()`

### Key State Variables:
- `answers`: Object { item_id: choice_id }
- `result`: Response từ submit API
- `remaining`: Thời gian countdown còn lại
- `attemptsWithScore`: Array lịch sử với điểm thang 10

---

## 🎓 KẾT LUẬN

Hệ thống kiểm tra và lưu kết quả được thiết kế **hoàn chỉnh** với các tính năng:
- ✅ Tính điểm chính xác (raw score + thang 10)
- ✅ Lưu lịch sử làm bài chi tiết
- ✅ Theo dõi điểm cao nhất
- ✅ Hiển thị chi tiết từng câu
- ✅ Quản lý thời gian với countdown
- ✅ Auto-submit khi hết giờ
- ✅ Fallback xử lý JSON lỗi

**⚠️ Cần lưu ý:**
- VARCHAR(2048) limit cho `att_responses_json`
- Nên migrate sang TEXT hoặc JSON type
- Test với nhiều câu hỏi để verify không bị truncate

**🚀 Next Steps:**
- Implement unit tests
- Optimize với indexing
- Consider caching best scores
- Add pagination cho history

---

**📅 Document Version**: 1.0  
**👤 Author**: AI Assistant  
**🗓️ Date**: October 15, 2025  
**🔄 Last Updated**: October 15, 2025
