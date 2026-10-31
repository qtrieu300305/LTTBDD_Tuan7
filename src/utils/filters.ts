import { Book } from "../types";

// Bỏ dấu tiếng Việt để "nha gia kim" vẫn tìm ra "Nhà Giả Kim"
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

export type PriceRange = "lt100" | "100to300" | "gt300" | null;

export const PRICE_RANGES: { key: Exclude<PriceRange, null>; label: string }[] = [
  { key: "lt100", label: "Dưới 100k" },
  { key: "100to300", label: "100k–300k" },
  { key: "gt300", label: "Trên 300k" },
];

// true nếu giá nằm trong khoảng r (null = không lọc)
const inRange = (price: number, r: PriceRange): boolean =>
  r === null ||
  (r === "lt100" ? price < 100000 : r === "100to300" ? price >= 100000 && price <= 300000 : price > 300000);

export interface BookFilter {
  keyword: string;
  categoryId: number | null;
  priceRange: PriceRange;
}

// Lọc KẾT HỢP: từ khoá (tên/tác giả) + danh mục + khoảng giá
export function filterBooks(books: Book[], f: BookFilter): Book[] {
  const k = normalize(f.keyword);
  return books.filter(
    (b) =>
      (k === "" || normalize(b.title).includes(k) || normalize(b.author).includes(k)) &&
      (f.categoryId === null || b.categoryId === f.categoryId) &&
      inRange(b.price, f.priceRange)
  );
}