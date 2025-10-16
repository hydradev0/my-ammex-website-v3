const { connectDB, getSequelize } = require('../config/db');

const run = async () => {
	try {
		console.log('🔄 Initializing database connection...');
		await connectDB();

		const sequelize = getSequelize();
		if (!sequelize) {
			console.log('⚠️  Sequelize instance not initialized (no DATABASE_URL?). Nothing to sync.');
			process.exit(0);
		}

		const force = String(process.env.DB_SYNC_FORCE || '').toLowerCase() === 'true';
		const alter = String(process.env.DB_SYNC_ALTER || '').toLowerCase() !== 'false';

		console.log(`🔧 Running sequelize.sync with options: { force: ${force}, alter: ${alter} }`);
		await sequelize.sync({ force, alter });
		console.log('✅ Database synchronized successfully.');
		process.exit(0);
	} catch (err) {
		console.error('❌ Sync failed:', err.message);
		process.exit(1);
	}
};

if (require.main === module) {
	run();
}

module.exports = { run };


