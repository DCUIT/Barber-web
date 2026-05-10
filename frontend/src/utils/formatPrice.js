export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const formatPrice = (amount) => {
  if (!amount) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
};