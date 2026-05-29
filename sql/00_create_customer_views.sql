CREATE OR REPLACE VIEW accounts AS SELECT * FROM read_parquet('data/curated/accounts.parquet');
CREATE OR REPLACE VIEW subscriptions AS SELECT * FROM read_parquet('data/curated/subscriptions.parquet');
CREATE OR REPLACE VIEW product_usage AS SELECT * FROM read_parquet('data/curated/product_usage.parquet');
CREATE OR REPLACE VIEW invoices AS SELECT * FROM read_parquet('data/curated/invoices.parquet');
CREATE OR REPLACE VIEW opportunities AS SELECT * FROM read_parquet('data/curated/opportunities.parquet');
CREATE OR REPLACE VIEW customer_success_touches AS SELECT * FROM read_parquet('data/curated/customer_success_touches.parquet');
CREATE OR REPLACE VIEW customer_360_source AS SELECT * FROM read_parquet('data/curated/customer_360.parquet');
