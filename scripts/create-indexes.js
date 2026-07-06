// Run this script to create all MongoDB indexes:
//   node scripts/create-indexes.js "mongodb+srv://user:pass@cluster.xxxxx.mongodb.net"

const { MongoClient } = require('mongodb');

async function createIndexes() {
    const uri = process.argv[2];
    if (!uri) {
        console.error('Usage: node scripts/create-indexes.js "YOUR_MONGODB_ATLAS_URI"');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    const db = client.db('license_manager');

    console.log('Connected to MongoDB. Creating indexes...\n');

    // users
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✓ users: email index');

    // products
    await db.collection('products').createIndex({ publisher_id: 1 });
    console.log('✓ products: publisher_id index');

    // license_templates
    await db.collection('license_templates').createIndex({ product_id: 1 });
    console.log('✓ license_templates: product_id index');

    // licenses
    await db.collection('licenses').createIndex({ license_key: 1 }, { unique: true });
    await db.collection('licenses').createIndex({ product_id: 1 });
    await db.collection('licenses').createIndex({ customer_email: 1 });
    await db.collection('licenses').createIndex({ status: 1 });
    await db.collection('licenses').createIndex(
        { expires_at: 1 },
        { partialFilterExpression: { status: 'active' } }
    );
    console.log('✓ licenses: all indexes');

    // activations
    await db.collection('activations').createIndex({ license_id: 1 });
    await db.collection('activations').createIndex(
        { license_id: 1, hardware_id: 1 },
        { unique: true, partialFilterExpression: { is_active: true } }
    );
    console.log('✓ activations: all indexes');

    // audit_logs
    await db.collection('audit_logs').createIndex({ created_at: -1 });
    console.log('✓ audit_logs: created_at index');

    // rate_limits
    await db.collection('rate_limits').createIndex({ identifier: 1, endpoint: 1 });
    await db.collection('rate_limits').createIndex(
        { window_start: 1 },
        { expireAfterSeconds: 120 }
    );
    console.log('✓ rate_limits: all indexes');

    console.log('\n✅ All indexes created successfully!');
    await client.close();
}

createIndexes().catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
