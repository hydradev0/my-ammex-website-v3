const { Sequelize } = require('sequelize');

// Recreate enum_Order_status to contain only: pending, rejected, cancelled
// Steps:
// 1) Create new type enum_Order_status_new with desired labels
// 2) Alter table "Order" column status to use the new type (with cast)
// 3) Drop old type enum_Order_status
// 4) Rename new type to enum_Order_status
// Safe to re-run: guards for existing new type and resets defaults
const DESIRED = ["pending", "rejected", "cancelled"];

const run = async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL not set');
      process.exit(1);
    }

    // Create an independent Sequelize instance for this migration
    const sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: databaseUrl.includes('sslmode=require') ? { require: true, rejectUnauthorized: false } : false
      }
    });

    // Verify connection
    await sequelize.authenticate();

    const enumType = 'enum_Order_status';
    const newEnumType = 'enum_Order_status_new';
    const tableName = 'Order';
    const columnName = 'status';

    // Get current labels
    const currentLabels = await sequelize.query(
      `SELECT e.enumlabel AS label
         FROM pg_type t
         JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = :enumType
        ORDER BY e.enumsortorder;`,
      { replacements: { enumType }, type: Sequelize.QueryTypes.SELECT }
    );
    const current = currentLabels.map(r => r.label);
    console.log('Current enum labels:', current);

    // If exactly matches desired set (order not important), bail
    const same = current.length === DESIRED.length && current.every(v => DESIRED.includes(v));
    if (same) {
      console.log('✅ enum_Order_status already matches desired labels. Nothing to do.');
      process.exit(0);
    }

    // Ensure new type does not already exist
    const [{ exists: newExists }] = await sequelize.query(
      `SELECT EXISTS (
         SELECT 1 FROM pg_type WHERE typname = :newEnumType
       ) AS exists;`,
      { replacements: { newEnumType }, type: Sequelize.QueryTypes.SELECT }
    );
    if (!newExists) {
      const valuesSql = DESIRED.map(v => `'${v}'`).join(', ');
      await sequelize.query(`CREATE TYPE "${newEnumType}" AS ENUM (${valuesSql});`);
      console.log(`✅ Created type ${newEnumType}`);
    } else {
      console.log(`ℹ️  Type ${newEnumType} already exists.`);
    }

    // Drop default to avoid cast issues
    await sequelize.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`);

    // Cast column to text then to new enum in one USING
    await sequelize.query(
      `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE "${newEnumType}" USING ("${columnName}"::text::"${newEnumType}");`
    );
    console.log('✅ Column migrated to new enum type');

    // Drop old type and rename new type back
    await sequelize.query(`DROP TYPE "${enumType}";`);
    await sequelize.query(`ALTER TYPE "${newEnumType}" RENAME TO "${enumType}";`);
    console.log('✅ Replaced old enum type with new desired labels');

    // Restore default
    await sequelize.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DEFAULT 'pending';`);
    console.log('✅ Default restored to pending');

    console.log('🎉 Done. enum now exactly:', DESIRED);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to recreate enum:', error.message);
    process.exit(1);
  }
};

run();



