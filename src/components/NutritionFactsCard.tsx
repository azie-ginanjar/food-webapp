export interface NutritionData {
  servingsPerContainer: string;
  servingSize: string;
  calories: number;
  totalFat: { amount: string; dv: number };
  saturatedFat: { amount: string; dv: number };
  transFat: { amount: string };
  cholesterol: { amount: string; dv: number };
  sodium: { amount: string; dv: number };
  totalCarb: { amount: string; dv: number };
  dietaryFiber: { amount: string; dv: number };
  totalSugars: { amount: string };
  addedSugars: { amount: string; dv: number };
  protein: { amount: string };
  vitaminD: { amount: string; dv: number };
  calcium: { amount: string; dv: number };
  iron: { amount: string; dv: number };
  potassium: { amount: string; dv: number };
}

export function NutritionFactsCard({ data }: { data: NutritionData }) {
  return (
    <div className="nutrition-label my-4 mx-auto md:mx-0 shadow-lg rounded-sm overflow-hidden">
      <div className="header">
        <h1>Nutrition Facts</h1>
      </div>
      <div className="servings">
        <p>{data.servingsPerContainer} servings per container</p>
        <p className="flex justify-between font-bold text-lg border-b-[10px] border-black pb-1 mb-1">
          <span>Serving size</span>
          <span className="serving-size">{data.servingSize}</span>
        </p>
      </div>

      <div className="calories-row">
        <div>
          <h2 className="font-black text-2xl">Amount per serving</h2>
          <h2 className="font-black text-4xl">Calories</h2>
        </div>
        <div className="calorie-amount font-black text-5xl">{data.calories}</div>
      </div>

      <div className="daily-value-header text-right font-bold text-sm border-b-4 border-black pb-1 mb-1">
        % Daily Value*
      </div>

      <div className="nutrient-row">
        <span><span className="nutrient-name">Total Fat</span> {data.totalFat.amount}</span>
        <span className="dv-pct">{data.totalFat.dv}%</span>
      </div>
      <div className="nutrient-row indented">
        <span><span className="nutrient-name normal">Saturated Fat</span> {data.saturatedFat.amount}</span>
        <span className="dv-pct">{data.saturatedFat.dv}%</span>
      </div>
      <div className="nutrient-row indented">
        <span><span className="nutrient-name normal">Trans Fat</span> {data.transFat.amount}</span>
      </div>

      <div className="nutrient-row">
        <span><span className="nutrient-name">Cholesterol</span> {data.cholesterol.amount}</span>
        <span className="dv-pct">{data.cholesterol.dv}%</span>
      </div>
      <div className="nutrient-row">
        <span><span className="nutrient-name">Sodium</span> {data.sodium.amount}</span>
        <span className="dv-pct">{data.sodium.dv}%</span>
      </div>

      <div className="nutrient-row">
        <span><span className="nutrient-name">Total Carbohydrate</span> {data.totalCarb.amount}</span>
        <span className="dv-pct">{data.totalCarb.dv}%</span>
      </div>
      <div className="nutrient-row indented">
        <span><span className="nutrient-name normal">Dietary Fiber</span> {data.dietaryFiber.amount}</span>
        <span className="dv-pct">{data.dietaryFiber.dv}%</span>
      </div>
      <div className="nutrient-row indented">
        <span><span className="nutrient-name normal">Total Sugars</span> {data.totalSugars.amount}</span>
      </div>
      <div className="nutrient-row double-indented">
        <span>Includes {data.addedSugars.amount} Added Sugars</span>
        <span className="dv-pct">{data.addedSugars.dv}%</span>
      </div>

      <div className="nutrient-row thick-border border-b-[10px] border-black pb-1 mb-1">
        <span><span className="nutrient-name">Protein</span> {data.protein.amount}</span>
      </div>

      <div className="nutrient-row">
        <span>Vitamin D {data.vitaminD.amount}</span>
        <span className="dv-pct">{data.vitaminD.dv}%</span>
      </div>
      <div className="nutrient-row">
        <span>Calcium {data.calcium.amount}</span>
        <span className="dv-pct">{data.calcium.dv}%</span>
      </div>
      <div className="nutrient-row">
        <span>Iron {data.iron.amount}</span>
        <span className="dv-pct">{data.iron.dv}%</span>
      </div>
      <div className="nutrient-row thick-border border-b-[5px] border-black pb-1 mb-1">
        <span>Potassium {data.potassium.amount}</span>
        <span className="dv-pct">{data.potassium.dv}%</span>
      </div>

      <p className="text-xs leading-tight mt-2 text-black">
        * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
      </p>
    </div>
  );
}
