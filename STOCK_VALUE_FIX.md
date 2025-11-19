# Stock Value Calculation Fix

## Problem

The `totalStockValue` field was not being calculated correctly when products were updated through the Products page. This was because the `updateProduct` function was using `findByIdAndUpdate()` which bypasses Mongoose pre-save hooks.

## What Was Fixed

### 1. Updated `productController.js`
Changed the `updateProduct` function to use `product.save()` instead of `findByIdAndUpdate()`. This ensures the pre-save hook runs and recalculates `totalStockValue` whenever:
- Stock quantity (`stockBaseUnit`) is updated
- Cost price (`costPrice`) is updated
- Unit type (`baseUnitType`) is changed

### 2. Created Recalculation Script
A utility script `recalculate-stock-values.js` was created to fix existing products in the database that have incorrect `totalStockValue`.

## How to Fix Your Existing Data

If you already have products in your database with incorrect stock values, run this command:

```bash
cd backend
npm run recalculate
```

This will:
1. Connect to your database
2. Fetch all products
3. Recalculate `totalStockValue` for each product based on:
   - For grams: `totalStockValue = (stockBaseUnit / 1000) * costPrice`
   - For pieces: `totalStockValue = stockBaseUnit * costPrice`
4. Update products that have incorrect values
5. Show a summary of what was updated

### Example Output

```
✓ Connected to database

Found 21 products
Starting recalculation...

✓ Updated: قهوة تركية
  Stock: 5.50 kg
  Cost Price: 45.00 TND
  Old Value: 0.00 TND
  New Value: 247.50 TND

✓ Updated: سكر
  Stock: 10.00 kg
  Cost Price: 8.50 TND
  Old Value: 0.00 TND
  New Value: 85.00 TND

================================
RECALCULATION COMPLETE
================================
Total products: 21
Updated: 18
Unchanged: 3
================================
```

## How It Works Now

### Product Model (backend/models/Product.js)

```javascript
// Pre-save hook automatically calculates totalStockValue
productSchema.pre('save', function(next) {
  if (this.baseUnitType === 'grams') {
    this.totalStockValue = (this.stockBaseUnit / 1000) * this.costPrice;
  } else {
    this.totalStockValue = this.stockBaseUnit * this.costPrice;
  }
  next();
});
```

This hook runs automatically whenever:
- A new product is created (`Product.create()`)
- A product is updated and saved (`product.save()`)
- Stock is moved through inventory management

### Where Stock Value is Used

1. **Inventory Page** (`frontend/src/pages/Inventory.jsx`):
   - Shows total stock value per product in the table

2. **Analytics Page** (`frontend/src/pages/Analytics.jsx`):
   - Capital Analysis report
   - Shows total capital invested in current stock
   - Calculates profit margins

3. **Reports** (`backend/controllers/reportController.js`):
   - Financial reports
   - Capital analysis
   - Product profitability

## Future Updates

Going forward, the stock value will be automatically calculated correctly whenever you:

1. **Create a new product**: Stock value calculated immediately
2. **Update product stock or cost price**: Stock value recalculated automatically
3. **Add/remove stock through inventory**: Stock value updated via pre-save hook
4. **Make sales**: Stock quantity changes trigger recalculation

## Technical Details

### Why `findByIdAndUpdate` Didn't Work

Mongoose's `findByIdAndUpdate()` is an atomic operation that updates the document directly in MongoDB without loading it into Mongoose first. This means:
- ❌ Pre-save hooks don't run
- ❌ Post-save hooks don't run
- ❌ Custom validation logic is bypassed (unless `runValidators: true`)

### Why `save()` Works

Using `product.save()`:
- ✅ Loads document into Mongoose
- ✅ Runs all pre-save hooks
- ✅ Runs all validators
- ✅ Runs all post-save hooks
- ✅ Properly tracks changes

## Verification

After running the recalculation script, verify the fix by:

1. **Check Inventory Page**:
   - Go to the Inventory page
   - Verify that "قيمة المخزون" (Stock Value) column shows correct values
   - Formula: Stock Quantity × Cost Price

2. **Check Analytics Page**:
   - Go to Analytics → Capital Analysis
   - Verify "رأس المال الحالي في المخزون" (Current Capital in Stock) shows correct total
   - Should match sum of all product stock values

3. **Test an Update**:
   - Go to Products page
   - Edit a product's stock or cost price
   - Check that stock value updates automatically in Inventory page

## Questions?

If you still see incorrect stock values after running the recalculation:

1. Make sure you ran `npm run recalculate` in the backend directory
2. Check that your `.env` file has the correct MongoDB connection string
3. Verify the script output shows products were updated
4. Refresh your browser to see updated values

If the issue persists, check the browser console and backend logs for errors.
