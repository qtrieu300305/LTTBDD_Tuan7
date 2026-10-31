# Trả lời câu hỏi bổ sung – Buổi 7 (BookStore)

## Câu 1. Cấu trúc điều hướng

BookDetail được đăng ký ở Stack (ngoài cùng) nên khi mở, màn Chi tiết phủ lên toàn bộ màn hình, che cả Tab Bar, và Native Stack tự thêm nút ← để quay lại màn trước. Nếu đặt BookDetail trong Tab thì nó trở thành một tab riêng: Tab Bar tự dựng sẽ có thêm một mục nữa (vì CustomTabBar vẽ theo `state.routes`), Tab Bar vẫn hiện khi xem sách và không có nút quay lại. Chi tiết sách là một màn "đi sâu" từ danh sách chứ không phải một mục điều hướng chính, nên đặt ở Stack là hợp lý.

## Câu 2. Redux

Trong reducer của Redux Toolkit, `state` thực chất là một bản nháp (draft) do thư viện Immer cung cấp. Immer ghi lại các thay đổi như `state.items.push(...)` rồi tạo ra một state mới bất biến, còn state gốc không bị sửa trực tiếp. Nếu bỏ `useMemo` trong `useCart`, kết quả hiển thị không đổi vì phép tính tổng vẫn cho cùng giá trị; hậu quả chỉ là tổng bị tính lại ở mỗi lần render, giỏ hàng lớn hoặc render nhiều thì tốn tài nguyên. `useMemo` chỉ để tối ưu hiệu năng, không quyết định đúng hay sai.

## Câu 3. Promise.all

Nếu `getCategories()` lỗi còn `getBooks()` thành công thì `Promise.all` bị từ chối ngay, nhảy vào `catch`, và Home hiện ErrorView dù sách đã tải được. Dùng `Promise.allSettled` thì chờ cả hai kết thúc và cho biết từng kết quả: ta vẫn hiển thị danh sách sách, chỉ thiếu các chip danh mục. Cái giá phải trả là phải tự kiểm tra và xử lý lỗi cho từng phần (code dài hơn), và người dùng có thể thấy một màn hình thiếu dữ liệu mà không biết vì sao nếu ta không báo rõ.

## Câu 4. Debounce

Nếu đặt `setTimeout` thẳng trong `onChangeText` thì mỗi phím gõ tạo ra một hẹn giờ riêng và không cái nào bị huỷ, nên mỗi phím vẫn gây ra một lần lọc (chỉ bị chậm đi chứ không gộp lại thành một lần). Hàm dọn dẹp `return () => clearTimeout(t)` huỷ hẹn giờ cũ mỗi khi giá trị đổi, nên chỉ lần gõ cuối cùng được áp dụng. Nó cũng tránh lỗi cập nhật state khi component đã bị gỡ (unmount) và tránh việc kết quả cũ ghi đè lên kết quả mới.

## Câu 5. Code bổ sung – Sắp xếp giá tăng dần / giảm dần

Thêm một state `sortOrder` và sửa `visibleBooks` trong `HomeScreen.tsx`:

```tsx
type SortOrder = "asc" | "desc" | null;
const [sortOrder, setSortOrder] = useState<SortOrder>(null);

const visibleBooks = useMemo(() => {
  const filtered = filterBooks(books, { keyword: debouncedKeyword, categoryId, priceRange });
  if (sortOrder === null) return filtered;
  // sắp xếp trên bản sao để không làm thay đổi mảng gốc
  return [...filtered].sort((a, b) => (sortOrder === "asc" ? a.price - b.price : b.price - a.price));
}, [books, debouncedKeyword, categoryId, priceRange, sortOrder]);
```

Hai nút bấm đặt trong `ListHeaderComponent`:

```tsx
<View style={styles.sortRow}>
  <Pressable
    style={[styles.sortBtn, sortOrder === "asc" && styles.sortBtnActive]}
    onPress={() => setSortOrder(sortOrder === "asc" ? null : "asc")}
  >
    <Text style={[styles.sortText, sortOrder === "asc" && styles.sortTextActive]}>Giá tăng dần ↑</Text>
  </Pressable>
  <Pressable
    style={[styles.sortBtn, sortOrder === "desc" && styles.sortBtnActive]}
    onPress={() => setSortOrder(sortOrder === "desc" ? null : "desc")}
  >
    <Text style={[styles.sortText, sortOrder === "desc" && styles.sortTextActive]}>Giá giảm dần ↓</Text>
  </Pressable>
</View>
```

*(Ảnh chụp màn hình kết quả đính kèm khi nộp bài.)*

---

## Thử thách BT7.C1 – Giải thích: vì sao đổi thư viện state thì giao diện không phải sửa?

Giao diện chỉ gọi hook `useWishlist()` (trả về `ids`, `isFavorite`, `toggle`) chứ không import `useDispatch`, `useSelector` hay action của Redux. Toàn bộ chi tiết Redux nằm gói gọn trong `store/hooks.ts` (đóng vai trò adapter). Nếu sau này đổi sang Zustand hay Recoil, ta chỉ viết lại phần bên trong `useWishlist()` sao cho vẫn trả về đúng ba thứ đó, còn các màn hình như BookDetail vẫn gọi `isFavorite(id)` và `toggle(id)` y như cũ nên không phải sửa dòng nào.

## Thử thách BT7.C2 – Lọc theo khoảng giá

Hàm `inRange` kiểm tra giá có nằm trong khoảng đã chọn hay không (`null` nghĩa là không lọc). Điều kiện này được nối bằng `&&` với điều kiện từ khoá và danh mục trong `filterBooks`, nên ba bộ lọc dùng chung và kết hợp được với nhau (sách phải thoả cả ba). `PriceFilter` vẽ 3 nút từ `PRICE_RANGES`; bấm nút đang chọn lần nữa thì gọi `onChange(null)` để bỏ chọn.
