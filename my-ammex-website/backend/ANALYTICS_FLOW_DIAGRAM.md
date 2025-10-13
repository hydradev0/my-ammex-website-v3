# Analytics System Flow Diagram

## Overview
This document explains how the analytics forecasting system works in `analyticsController.js`.

---

## 1. Sales Forecast Generation Flow

```mermaid
flowchart TD
    A[Frontend: Request Sales Forecast] -->|POST /api/analytics/forecast/sales| B[analyticsController.generateSalesForecast]
    
    B --> C[Query PostgreSQL Database]
    
    C --> D1[Get Historical Sales Data<br/>Table: sales_fact_monthly<br/>Fields: revenue, orders, customers, avg_order_value]
    C --> D2[Get Top Products Data<br/>Table: sales_fact_monthly_by_product<br/>Strategy: Previous Year Same Months + Fallback]
    
    D1 --> E[Format Data for AI]
    D2 --> E
    
    E --> F[preprocessDataForLLM<br/>Round numbers, clean format]
    E --> G[preprocessTopProductsForLLM<br/>Group by month, top 5 per month]
    
    F --> H[callOpenRouterAPISales]
    G --> H
    
    H --> I[Build AI Prompt<br/>Include:<br/>- Historical sales trends<br/>- Top products by month<br/>- Forecast period<br/>- Current date context]
    
    I --> J[Call OpenRouter API<br/>Model: Claude 3.5 Sonnet<br/>Temperature: 0.3<br/>Max Tokens: 2000]
    
    J --> K{API Response OK?}
    
    K -->|No| L[Error Handling<br/>- Rate limiting<br/>- Model unavailable<br/>- Invalid response]
    L --> M[Return Error to Frontend]
    
    K -->|Yes| N[Parse AI Response<br/>Extract JSON from response<br/>Remove markdown if present]
    
    N --> O[validateForecastResponse<br/>- Check required fields<br/>- Normalize growth percentage<br/>- Generate month labels<br/>- Calculate MoM changes]
    
    O --> P[Return Forecast to Frontend<br/>Including:<br/>- Monthly predictions<br/>- Top products per month<br/>- Growth metrics<br/>- Insights & recommendations]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#f0f0f0
    style H fill:#ffe1e1
    style J fill:#ffe1f0
    style O fill:#e1ffe1
    style P fill:#e1f5ff
```

---

## 2. Bulk Customer Forecast Flow

```mermaid
flowchart TD
    A[Frontend: Request Bulk Forecast] -->|POST /api/analytics/forecast/bulk| B[analyticsController.generateCustomerBulkForecast]
    
    B --> C[Query PostgreSQL Database]
    
    C --> D1[Get Historical Bulk Data<br/>Table: customer_bulk_monthly<br/>Fields: bulk_orders_count, bulk_orders_amount]
    C --> D2[Get Top Bulk Customers<br/>Table: customer_bulk_monthly_by_name<br/>Strategy: Previous Year Same Months + Fallback]
    
    D1 --> E[Format Bulk Data]
    D2 --> F[preprocessTopBulkCustomersForLLM<br/>Include customer names & model numbers]
    
    E --> G[callOpenRouterAPIBulk]
    F --> G
    
    G --> H[Build AI Prompt<br/>Include:<br/>- Historical bulk order patterns<br/>- Top customers by month<br/>- Customer model preferences]
    
    H --> I[Call OpenRouter API<br/>Model: Claude 3.5 Sonnet<br/>Temperature: 0.3<br/>Max Tokens: 1600]
    
    I --> J{API Response OK?}
    
    J -->|No| K[Error Handling]
    K --> L[Return Error]
    
    J -->|Yes| M[Parse AI Response]
    
    M --> N[validateBulkForecastResponse<br/>- Validate structure<br/>- Normalize growth percentage<br/>- Generate month labels<br/>- Calculate MoM changes<br/>- Validate top customers list]
    
    N --> O[Return Bulk Forecast<br/>Including:<br/>- Bulk order predictions<br/>- Top customers per month<br/>- Expected amounts<br/>- Customer model numbers]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#f0f0f0
    style G fill:#ffe1e1
    style I fill:#ffe1f0
    style N fill:#e1ffe1
    style O fill:#e1f5ff
```

---

## 3. Historical Data Retrieval Flow

```mermaid
flowchart TD
    A[Frontend: Request Historical Data] --> B{Endpoint Type}
    
    B -->|Sales Data| C[getHistoricalSalesForAI]
    B -->|Customer Data| D[getHistoricalCustomerData]
    B -->|Top Products| E[getTopProducts]
    B -->|Top Customers| F[getTopBulkCustomers]
    
    C --> G1[Query: sales_fact_monthly<br/>Filter by months parameter<br/>Exclude/Include current month]
    D --> G2[Query: customer_bulk_monthly<br/>JOIN with sales_fact_monthly<br/>Filter by months]
    E --> G3[Query: sales_fact_monthly_by_product<br/>Strategy:<br/>1. Same months from 2-3 years ago<br/>2. Recent 12 months<br/>3. Fallback: Last 6 months]
    F --> G4[Query: customer_bulk_monthly_by_name<br/>Strategy:<br/>1. Same months from 2-3 years ago<br/>2. Recent 12 months<br/>3. Fallback: Last 6 months]
    
    G1 --> H1[Format Sales Data<br/>Fields: month, sales, orders, customers, avgOrderValue]
    G2 --> H2[Format Customer Data<br/>Fields: month, newCustomers, bulkOrdersCount, bulkOrdersAmount]
    G3 --> H3[Format Top Products<br/>Group by month<br/>Include: modelNo, category, orderCount]
    G4 --> H4[Format Top Customers<br/>Group by month<br/>Include: customerName, ranking, amounts]
    
    H1 --> I[Return JSON Response<br/>with metadata:<br/>- totalMonths<br/>- dateRange<br/>- success flag]
    H2 --> I
    H3 --> I
    H4 --> I
    
    style A fill:#e1f5ff
    style C fill:#fff4e1
    style D fill:#fff4e1
    style E fill:#fff4e1
    style F fill:#fff4e1
    style I fill:#e1ffe1
```

---

## 4. Data Strategy: Historical Data Lookup

```mermaid
flowchart TD
    A[Request for Historical Context] --> B[Primary Strategy:<br/>Same Months from Previous 2-3 Years]
    
    B --> C{Data Found?}
    
    C -->|Yes| D[Use Primary Data]
    C -->|No or Incomplete| E[Secondary Strategy:<br/>Recent 12 Months Data]
    
    E --> F{Sufficient Data?}
    
    F -->|Yes| G[Combine Primary + Secondary Data<br/>Remove duplicates]
    F -->|No| H[Fallback Strategy:<br/>Last 6 Months]
    
    H --> I[Combine All Available Data]
    
    D --> J[Return Historical Context for AI]
    G --> J
    I --> J
    
    J --> K[AI receives context with:<br/>- Seasonal patterns<br/>- Year-over-year trends<br/>- Recent performance]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style E fill:#ffe1e1
    style H fill:#ffcccc
    style K fill:#e1ffe1
```

---

## 5. Database Schema Overview

```mermaid
erDiagram
    SALES_FACT_MONTHLY {
        date month_start PK
        decimal total_revenue
        int total_orders
        int total_units
        decimal avg_order_value
        int new_customers
    }
    
    SALES_FACT_MONTHLY_BY_PRODUCT {
        date month_start PK
        string model_no PK
        string category_name
        int category_id
        int subcategory_id
        int order_count
    }
    
    CUSTOMER_BULK_MONTHLY {
        date month_start PK
        int bulk_orders_count
        decimal bulk_orders_amount
    }
    
    CUSTOMER_BULK_MONTHLY_BY_NAME {
        date month_start PK
        string customer_name PK
        int bulk_orders_count
        decimal bulk_orders_amount
        decimal average_bulk_order_value
        int ranking
        string model_no
    }
    
    SALES_FACT_MONTHLY ||--o{ SALES_FACT_MONTHLY_BY_PRODUCT : "aggregates"
    CUSTOMER_BULK_MONTHLY ||--o{ CUSTOMER_BULK_MONTHLY_BY_NAME : "aggregates"
```

---

## 6. OpenRouter API Integration

```mermaid
sequenceDiagram
    participant Controller
    participant OpenRouter
    participant Claude
    
    Controller->>Controller: Prepare prompt with historical data
    Controller->>OpenRouter: POST /api/v1/chat/completions<br/>Headers: Authorization, Content-Type<br/>Body: {model, messages, temperature, max_tokens}
    
    OpenRouter->>Claude: Forward request to Claude 3.5 Sonnet
    
    Claude->>Claude: Analyze historical data<br/>Identify patterns<br/>Generate forecast
    
    Claude->>OpenRouter: JSON response with predictions
    OpenRouter->>Controller: HTTP 200 + JSON result<br/>{choices, usage}
    
    Controller->>Controller: Extract content from response
    Controller->>Controller: Clean markdown if present
    Controller->>Controller: Parse JSON
    Controller->>Controller: Validate structure
    Controller->>Controller: Calculate dynamic values<br/>(month labels, MoM changes)
    
    Controller-->>Frontend: Return formatted forecast
    
    Note over Controller,Claude: Temperature: 0.3 for consistent predictions<br/>Max Tokens: 2000 (sales) / 1600 (bulk)
```

---

## 7. Error Handling Flow

```mermaid
flowchart TD
    A[API Call to OpenRouter] --> B{Response Status}
    
    B -->|404| C[Model Not Available Error]
    B -->|429| D[Rate Limited Error]
    B -->|Other Error| E[Generic API Error]
    B -->|200 OK| F[Parse Response]
    
    F --> G{Valid JSON?}
    
    G -->|No| H[JSON Parse Error]
    G -->|Yes| I{Has Required Fields?}
    
    I -->|No| J[Validation Error]
    I -->|Yes| K[Success]
    
    C --> L[User-Friendly Error Message:<br/>"AI model is not available"]
    D --> M[User-Friendly Error Message:<br/>"Service temporarily busy"<br/>Retryable: true]
    E --> N[User-Friendly Error Message:<br/>"Service temporarily unavailable"]
    H --> O[User-Friendly Error Message:<br/>"Unexpected response format"]
    J --> P[User-Friendly Error Message:<br/>"Invalid forecast structure"]
    
    L --> Q[Return 500 Error Response]
    M --> Q
    N --> Q
    O --> Q
    P --> Q
    
    K --> R[Return 200 Success Response]
    
    style A fill:#e1f5ff
    style K fill:#e1ffe1
    style C fill:#ffcccc
    style D fill:#ffcccc
    style E fill:#ffcccc
    style H fill:#ffcccc
    style J fill:#ffcccc
    style R fill:#ccffcc
```

---

## Key Features

### 1. **Intelligent Data Lookup Strategy**
- **Primary**: Same months from previous 2-3 years (seasonal patterns)
- **Secondary**: Recent 12 months (current trends)
- **Fallback**: Last 6 months (minimum context)

### 2. **AI Model Configuration**
- **Model**: Claude 3.5 Sonnet (via OpenRouter)
- **Temperature**: 0.3 (balanced between creativity and consistency)
- **Max Tokens**: 2000 for sales, 1600 for bulk forecasts

### 3. **Data Preprocessing**
- Round monetary values
- Normalize customer names
- Group products by category
- Calculate historical averages

### 4. **Validation & Normalization**
- Ensure required fields exist
- Normalize growth percentages (0-100 scale)
- Generate dynamic month labels
- Calculate Month-over-Month changes
- Validate top products/customers lists

### 5. **Response Enhancement**
- Add metadata (timestamps, usage stats)
- Include confidence metrics
- Provide actionable insights
- Generate recommendations

---

## Environment Variables Required

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_REFERER=http://localhost:3000
DATABASE_URL=postgresql://...
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/historical-sales` | GET | Get historical sales data for AI training |
| `/api/analytics/historical-customers` | GET | Get historical customer data |
| `/api/analytics/top-products` | GET | Get top performing products by month |
| `/api/analytics/top-bulk-customers` | GET | Get top bulk customers by month |
| `/api/analytics/forecast/sales` | POST | Generate AI sales forecast |
| `/api/analytics/forecast/bulk` | POST | Generate AI bulk customer forecast |
| `/api/analytics/dashboard-metrics` | GET | Get dashboard summary metrics |
| `/api/analytics/ytd-growth` | GET | Calculate Year-to-Date growth |

---

## Notes

1. **No JSON File Reading**: The system queries PostgreSQL database directly, not JSON files
2. **Real-time Processing**: All data is fetched and processed in real-time
3. **Caching**: Consider implementing Redis caching for frequently accessed data
4. **Rate Limiting**: OpenRouter API has rate limits - handle gracefully
5. **Database Performance**: Ensure indexes on `month_start` columns for fast queries

