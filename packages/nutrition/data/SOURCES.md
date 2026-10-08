# Food values: sources and method

`foods-sourced.json` has one record for each of the 180 Indian and everyday foods in
`src/foods.ts`; `foods-global-sourced.json` has one for each of the 151 global foods (see below). Each record holds:

- `gramsPerUnit`
- `kcal`, `protein`, `carbs` and `fat` for one unit
- `per100g` values
- `source`
- `confidence`: `high`, `medium` or `low`
- an optional `note`
- the `old` values, for comparison

Any `source` that contains "estimate" is our own calculation. It was built from the ingredient
values listed in brackets. For every record, `protein*4 + carbs*4 + fat*9` is within 15 % of `kcal`.

## Sources

| Source | Used for | Licence |
|---|---|---|
| **Indian Nutrient Databank (INDB)**, lindsayjaacks/Indian-Nutrient-Databank-INDB- on GitHub (last commit 2025-04-08). We used `INDB.xlsx` for nutrients per 100 g and per serving unit across 1,014 recipes, plus `recipes.xlsx` for the ingredient lists. The recipes come from *The Art & Science of Cooking* (ASC), *Basic Food Preparation* (BFP) and open web recipes (OSR). Codes appear as `INDB ASC146` and so on. | Cooked dishes: curries, sabzis, dals, rice dishes, sweets and drinks | **The repo has no licence file**, and the GitHub API reports none. We copy only individual numeric facts with a citation. Do not redistribute the raw INDB files without asking the authors. https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB- |
| **ICMR-NIN Indian Food Composition Tables 2017 (IFCT)**, Longvah et al., NIN Hyderabad. We read the values from the `@ifct2017/compositions` npm package (v2.0.9). Codes appear as `IFCT A019` and so on. | Raw ingredients for dishes we built ourselves: flours, dals, vegetables, paneer, khoa, eggs, nuts, sugarcane juice, coconut water | The data is © ICMR-NIN. The npm package code is MIT. Cite as: Longvah T, Ananthan R, Bhaskarachary K, Venkaiah K. *Indian Food Composition Tables 2017*. NIN, Hyderabad. https://www.ifct2017.com |
| **USDA FoodData Central, SR Legacy**. Every FDC id was checked against `api.nal.usda.gov`. Codes appear as `USDA FDC 173944` and so on. | Fruit, bread, cooked rice, oats, cornflakes, yoghurt, butter, cheese, chicken breast, egg white, fried egg, whey, defatted soy flour (as a stand-in for soya chunks), tofu, peanuts, peanut butter, coffee, tea, cola | Public domain (CC0 1.0). https://fdc.nal.usda.gov |
| **FSSAI milk standards** (FSS Food Product Standards Regulations 2011, 2.1.2): toned milk has at least 3.0 % fat and 8.5 % SNF; full-cream milk has at least 6.0 % fat and 9.0 % SNF | Toned and full-cream milk. Protein and carbs come from typical labels and are approximate. | Public regulation |
| **Bognár A. (2002)**, *Tables on weight yield of food and retention factors of food constituents*, BFE-R-02-03, Karlsruhe | Cooking-yield factors (see Method) | Cited reference only |

## Method

1. **Why INDB per-100 g values are adjusted.** INDB's own Stata code (`INDB.do`) divides a
   recipe's nutrients by the **raw** weight of its ingredients. It applies no yield factor. This
   causes two problems:
   - Recipes are inconsistent about water. Rajma and curd rice list no cooking water. Dal makhani
     lists 4 cups.
   - Deep-fried recipes count **all of the frying oil**. Samosa comes out at 577 kcal/100 g and
     pakora at 677 kcal/100 g, which is not usable.

   The rules below handle this.
2. **Pulse dishes** (dal, rajma, chole): we treat 1 katori as 30 g of raw pulse. That is the NIN
   portion size, and INDB's pulse recipes also use 30 g per bowl (ASC151, ASC162, ASC165).
   - Where INDB has a matching single-bowl recipe, we use its per-serving value directly.
   - Otherwise we build the dish from IFCT ingredients: 30 g dal plus the tadka fat.
3. **Curries, sabzis and other simmered dishes**: INDB per-100 g ÷ 0.85. This assumes a 15 % weight
   loss in cooking (Bognár 2002, braised and stewed dishes), then scales to 150 g.
   - Breads cooked on a tawa use ÷ 0.87.
   - Rice dishes that already include their water use ÷ 0.95.
   - Reduced milk sweets use the reduction stated in the record.
4. **Rice dishes whose recipe lists raw rice but no water** (biryani, curd rice, lemon rice, poha):
   we take INDB's per-serving nutrients and divide by an estimated cooked weight for that serving.
   Rice absorbs about 1.9 times its raw weight in water.
5. **Deep-fried items** (samosa, puri, bhatura, vada, pakora, kachori, gulab jamun, jalebi,
   manchurian and others) are built from IFCT ingredients, with oil uptake of 14-20 % of fried
   weight. These are estimates.
6. **Pieces**: where INDB has a realistic piece, one unit equals one INDB serving (masala dosa,
   besan ladoo). Otherwise we use INDB's recipe ratios scaled to the stated portion weight.

## Portion weights

| Unit | Weight | Reference |
|---|---|---|
| katori | 150 g | NIN household measure. One katori of dal is 30 g raw pulse, as in the NIN *Dietary Guidelines for Indians* portion. |
| roti | 40 g cooked, from about 27 g atta | INDB ASC096 uses 20 g atta for a small chapati |
| masala dosa | 170 g (was 180) | INDB ASC146: 30 g rice, 10 g urad, 50 g potato and 37 g onion, plus ~15 g oil and 60 ml water per dosa (210 g raw) |
| plain dosa | 80 g, from 45 g dry batter | Restaurant size. INDB BFP148 is a small 32 g-batter dosa. |
| fried egg | 46 g (was 55) | USDA weight of one large egg, fried |
| glasses | 250 ml, counted as 250 g | |
| fruit | edible portion | USDA medium sizes |

## Changed portion weights

- fried-egg: 55 → 46 g
- masala-dosa: 180 → 170 g
- muesli: 240 → 245 g
- cornflakes: 230 → 235 g
- bread-omelette: 160 → 165 g
- paneer-sandwich: 160 → 146 g
- pav-bhaji: 300 → 290 g
- chole-bhature: 350 → 310 g

Each change is the sum of the stated components. Labels that contained a gram weight were updated.

## Known gaps and approximations

- **No INDB recipe**, so these were built from ingredients:
  - chicken biryani (uses INDB's mutton biryani)
  - paneer bhurji, pongal, chicken 65, shawarma, kulcha (uses naan as a stand-in), khichdi
  - sprouts, malai kofta, fish fry
  - every deep-fried snack
- **IFCT paneer** (L003) lists 12.4 g carbohydrate and 14.8 g fat per 100 g. Commercial Indian
  paneer labels show 1-4 g carbohydrate and 20-24 g fat. We kept IFCT and flagged it in each
  paneer record.
- **Not verified against a primary source**: roasted chana and makhana (quoted from memory of NIN
  *Nutritive Value of Indian Foods*), Maggi, namkeen, muesli and cream (typical labels). All are
  marked "estimate".
- **INDB home recipes** are lighter than restaurant food. Restaurant paneer gravies, butter chicken,
  dal makhani and biryani can be 1.3-1.8 times the listed value, mainly from extra oil, butter and
  cream.

## Overrides applied in `src/foods.ts`

- `paneer` keeps 265 kcal, P18, C3.5, F20 per 100 g (typical Indian paneer labels) instead of IFCT's
  12.4 g carbs / 14.8 g fat, which do not match commercial paneer.

## Global foods (`foods-global-sourced.json`)

151 foods for people who do not mostly eat Indian food: breakfast staples, fast food, Western
meals, East Asian and Middle Eastern dishes, meats and fish, vegetables, fruit, packaged snacks,
nuts, spreads and drinks. Every value comes from **USDA FoodData Central**, public domain (CC0 1.0):

- **FNDDS 2021-2023** (`FoodData_Central_survey_food_csv_2024-10-31`), the survey database behind
  What We Eat in America. It describes foods as eaten (a cheeseburger, a slice of restaurant pizza,
  a bowl of pad thai) with USDA's own portion weights. Used for most rows.
- **SR Legacy** (`FoodData_Central_sr_legacy_food_csv_2018-04`) for a few ingredients and branded
  fast-food items that FNDDS lacks (blueberry muffin, Greek yogurt, pepperoni pizza slice, sub,
  chicken sandwich, spaghetti with meat sauce, broccoli, spinach, cantaloupe, chocolate).

Method:

1. Each record names its FDC id, data set, the USDA description and the USDA portion used for
   `gramsPerUnit` (for example "1 medium pancake" = 50 g). Where we use a multiple or a fraction of a
   USDA portion, the record says so ("1 egg = 55 g, x2").
2. Energy, protein, carbohydrate and fat per unit are the USDA per-100 g values (nutrients 208, 203,
   205, 204) multiplied by `gramsPerUnit / 100`, rounded to whole kcal and 0.1 g.
3. `confidence` is `high` for a specific food and `medium` for a USDA "NFS" (not further specified)
   average.
4. Atwater check: every row's `protein*4 + carbs*4 + fat*9` is within 15 % of `kcal`, except beer and
   wine (alcohol, 7 kcal/g, is not a macro here) and broccoli (fibre counted in carbohydrate).

The full FDC data sets are not redistributed; only the per-food numbers with their ids. To check a
row: https://fdc.nal.usda.gov/food-details/<fdc id>/nutrients
