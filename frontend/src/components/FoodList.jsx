import FoodCard from "./FoodCard";

// Danh sách món ăn, nhận props: foods, onAdd
export default function FoodList({ foods, onAdd }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {foods.map(f => (
        <FoodCard key={f.id} food={f} onAdd={onAdd} />
      ))}
    </div>
  );
}
