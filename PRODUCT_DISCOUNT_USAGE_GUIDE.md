# Product Discount Management - User Guide

## Quick Start

### Accessing the Feature
1. Log in as **Admin** or **Sales Marketing** user
2. Click the **menu icon** (three lines) in the top-right corner
3. Select **"Product Discounts"** from the dropdown menu

---

## Feature Overview

### 1. Browse & Select Products

#### Search Products
- Use the search bar at the top to find products by:
  - Product name
  - Model number
  - Item code
  - Category name
- Search updates results in real-time

#### Filter by Category
1. Click the **"Filters"** button to expand category options
2. Select a category to view only products in that category
3. Click the active category tag (with X) to remove the filter
4. Click **"All Categories"** to view everything

#### Select Products
- **Individual Selection**: Click on any product card to select/deselect it
- **Bulk Selection**: Click **"Select All on Page"** to select all visible products
- Selected products have a blue border and checkmark icon
- Selected count is shown at the top: "X selected • Page Y of Z"

#### Navigate Pages
- Use **Previous** and **Next** buttons to navigate
- Click page numbers to jump to specific pages
- **10 products shown per page** for optimal performance
- System loads up to **70 products (7 pages)** for fast browsing

---

### 2. AI-Suggested Products (Smart Feature!)

#### From Website Analytics
1. Go to **Website Analytics** → **Website Traffics**
2. Click **"Generate AI Insights"** button
3. Scroll down to the **"Suggested Discounts"** section
4. Click **"Apply Discount"** on any suggested product
   - **OR** click **"Apply Discounts to All"** for bulk action

#### What Happens Next
- You'll be redirected to Product Discount Management
- AI-suggested products are **automatically pre-selected**
- Discount percentage is **pre-filled** based on AI recommendation
- A purple banner confirms AI suggestions are active
- You can still adjust the selection before applying

#### AI Banner Features
- Shows how many products were pre-selected
- Click the **X** button to dismiss AI mode (selection remains)
- AI mode clears automatically after applying discount

---

### 3. Configure Discount

#### Quick Discount Tiers
- Click one of the preset buttons:
  - **Small: 5%**
  - **Medium: 10%**
  - **Large: 15%**
- Selected tier is highlighted in blue

#### Custom Discount
- Enter any percentage in the **"Discount Percentage"** field
- Valid range: 1% to 50% (maximum can be configured)
- Decimals are supported (e.g., 12.5%)

#### Optional Date Range
- **Start Date**: When discount becomes active
- **End Date**: When discount expires
- Leave blank for permanent discount
- End date must be after start date

#### Apply Discount
1. Ensure products are selected
2. Set discount percentage
3. (Optional) Set date range
4. Click the green **"Apply Discount to X Product(s)"** button
5. Success message appears
6. Selected products are cleared
7. Discount form resets

---

### 4. View Current Discounts

#### Discounted Products Table
Located below the discount configuration section, this table shows:

**Columns:**
- **Product**: Model number and item code
- **Original Price**: Price before discount
- **Discount**: Percentage off badge (red)
- **Discounted Price**: Final price (green, bold)
- **Period**: Start and end dates
- **Status**: Active or Inactive badge
- **Actions**: Remove button

#### Remove Discount
- Click **"Remove"** button in the Actions column
- Confirmation message appears
- Product returns to regular pricing

---

## Common Workflows

### Scenario 1: Apply 10% Discount to Tools Category
```
1. Click "Filters" button
2. Select "Tools" category
3. Click "Select All on Page"
4. Click "Medium: 10%" quick tier
5. Click "Apply Discount to X Product(s)"
```

### Scenario 2: Apply AI-Suggested Discounts
```
1. Go to Website Analytics
2. Generate AI Insights
3. Review "Suggested Discounts" section
4. Click "Apply Discounts to All"
5. Review pre-selected products
6. Adjust discount if needed
7. Click "Apply Discount"
```

### Scenario 3: Limited-Time Flash Sale
```
1. Search for specific products
2. Select desired products
3. Enter "20" in discount percentage
4. Set Start Date: Today
5. Set End Date: 3 days from now
6. Click "Apply Discount"
```

### Scenario 4: Remove All Discounts from Category
```
1. Scroll to "Currently Discounted Products" table
2. Find products by category
3. Click "Remove" for each product
   (Future: Bulk remove feature planned)
```

---

## Tips & Best Practices

### Performance & Efficiency
- ⚡ **Fast Loading**: System loads 70 products (7 pages) for optimal speed
- ⚡ **Use Search**: Quickly find specific products instead of browsing all pages
- ⚡ **Use Filters**: Category filters help narrow down your selection
- ⚡ **10 per Page**: Smaller pages load faster and are easier to review

### Selection Management
- ✅ **Review before applying**: Double-check selected products
- ✅ **Use pagination**: Select products across multiple pages if needed
- ✅ **Clear and restart**: Click "Clear all" to deselect everything

### Discount Strategy
- 🎯 **Small discounts (5-10%)**: For high-margin products
- 🎯 **Medium discounts (10-15%)**: For slow-moving inventory
- 🎯 **Large discounts (15-25%)**: For clearance or promotion

### AI Insights
- 🤖 AI identifies products with **high clicks but low cart additions**
- 🤖 Suggested discounts are **data-driven** (not random)
- 🤖 Review AI reasoning before applying

### Date Management
- 📅 **No dates**: Discount stays until manually removed
- 📅 **Start date only**: Discount starts on date, never expires
- 📅 **Both dates**: Automatic activation and expiration
- 📅 **Use for events**: Holiday sales, seasonal promotions

---

## Troubleshooting

### "No products found"
- Check if filters are too restrictive
- Clear category filter by clicking the tag with X
- Clear search term and try again

### Discount not applying
- Ensure at least one product is selected
- Enter a valid discount percentage (1-50%)
- Check for error messages below the form

### Products not visible in table
- Scroll down to "Currently Discounted Products" section
- Refresh the page if recently applied
- Check if discount has expired (past end date)

### AI suggestions not working
- Ensure you clicked "Apply Discount" from AI insights
- Check URL for parameters: `?suggested=ai&...`
- Verify products exist in the catalog

---

## Keyboard Shortcuts (Future Enhancement)

These shortcuts are planned for future releases:
- `Ctrl + F`: Focus search box
- `Ctrl + A`: Select all on page
- `Ctrl + D`: Clear all selections
- `Enter`: Apply discount (when form is valid)
- `Escape`: Close modals

---

## Mobile Usage

The interface is fully responsive:
- **Grid**: Adjusts to 1 column on mobile
- **Filters**: Expand/collapse to save space
- **Pagination**: Touch-friendly buttons
- **Selected products**: Horizontal scroll on small screens

---

## Permissions

| Role | Access Level |
|------|-------------|
| **Admin** | Full access to all features |
| **Sales Marketing** | Full access to all features |
| **Sales Clerk** | No access |
| **Accountant** | No access |

---

## Support

### Need Help?
- Check this guide first
- Review the implementation documentation
- Contact system administrator
- Report bugs to development team

### Feature Requests
The following features are under consideration:
- Bulk remove discounts
- Export discount report
- Discount performance analytics
- Customer-specific discounts
- Discount approval workflow

---

## Summary Checklist

Before applying a discount:
- [ ] Products are correctly selected
- [ ] Discount percentage is appropriate
- [ ] Date range is set (if needed)
- [ ] Review impact on profit margins
- [ ] Confirm with team if large discount

After applying a discount:
- [ ] Verify products appear in "Currently Discounted Products" table
- [ ] Check website to confirm discount displays correctly
- [ ] Monitor sales performance
- [ ] Remove or adjust discount as needed

---

**Happy Discounting! 🏷️**

